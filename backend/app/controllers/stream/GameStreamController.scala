package app.controllers.stream

import javax.inject._
import scala.concurrent.{ExecutionContext, Future, Promise}
import scala.concurrent.duration._

import akka.actor.ActorSystem
import akka.stream.Materializer
import akka.stream.OverflowStrategy
import akka.stream.scaladsl.Source
import akka.util.ByteString

import play.api.libs.json._
import play.api.mvc._

import app.mapping.IViewStateMapper
import app.controllers.support.ControllerSupport
import app.api.eventHub.{GameEvent, GameEventHub}
import app.auth.{AuthPrincipal, SupabaseJwt}
import app.session.{GameSessionId, SessionInfo, PlayerToken}
import app.session.repositories.IGameSessionRepository
import app.models.state.WebGameState
import app.api.context.IGameContextRepository
import app.session.IGameSessionService

@Singleton
final class GameStreamController @Inject()(
  cc: ControllerComponents,
  eventHub: GameEventHub,
  viewStateMapper: IViewStateMapper,
  sessionRepo: IGameSessionRepository,
  ctxRepo: IGameContextRepository,
  sessionService: IGameSessionService,
  jwt: SupabaseJwt
)(implicit ec: ExecutionContext, system: ActorSystem, mat: Materializer)
  extends AbstractController(cc)
    with ControllerSupport
    with IGameStreamController {

  private def sidFromQuery(req: RequestHeader): Either[Result, GameSessionId] =
    req.getQueryString("sid").map(_.trim).filter(_.nonEmpty) match {
      case Some(raw) => Right(GameSessionId(raw))
      case None      => Left(BadRequest(Json.obj("error" -> "Missing sid query param")))
    }

  private def requireOnlineAuth(req: RequestHeader): Either[Result, (AuthPrincipal, PlayerToken)] = {
    given SupabaseJwt = jwt
    (requirePrincipal(req), requirePlayerToken(req)) match {
      case (Left(res), _)          => Left(res)
      case (_, Left(res))          => Left(res)
      case (Right(p), Right(token)) => Right((p, token))
    }
  }

  override def sse: Action[AnyContent] = Action.async { implicit req =>
    requireOnlineAuth(req) match {
      case Left(res) =>
        Future.successful(res)

      case Right((principal, token)) =>
        sidFromQuery(req) match {
          case Left(res) => Future.successful(res)

          case Right(sid) =>
            val (queue, src) =
              Source.queue[GameEvent](32, OverflowStrategy.dropHead).preMaterialize()

            val unsubscribe = eventHub.subscribe(sid) { ev =>
              queue.offer(ev).failed.foreach(_ => ())(ec)
              ()
            }

            queue.watchCompletion().foreach { _ =>
              unsubscribe()
              sessionService.leaveSessionDisconnected(principal, token, sid)
              ()
            }(ec)

            def infoOpt: Option[SessionInfo] = sessionRepo.get(sid)

            val snapshotSource: Source[ByteString, _] =
              ctxRepo.get(sid) match {
                case Some(ctx) =>
                  val web: WebGameState =
                    viewStateMapper.toWebState(ctx, Some(principal), infoOpt)

                  val json = Json.obj("eventId" -> 0L, "state" -> Json.toJson(web))

                  Source.single(
                    ByteString(
                      s"id: 0\n" +
                      s"data: ${Json.stringify(json)}\n\n"
                    )
                  )

                case None =>
                  Source.empty
              }

            val liveSource: Source[ByteString, _] =
              src.map { ev =>
                val web: WebGameState =
                  viewStateMapper.toWebState(ev.ctx, Some(principal), infoOpt)

                val json = Json.obj(
                  "eventId" -> ev.eventId,
                  "state"   -> Json.toJson(web),
                  "meta"    -> ev.meta
                )

                ByteString(
                  s"id: ${ev.eventId}\n" +
                  s"data: ${Json.stringify(json)}\n\n"
                )
              }

            val keepAlive: Source[ByteString, _] =
              Source.tick(10.seconds, 10.seconds, ByteString(": keep-alive\n\n"))

            val out = snapshotSource.concat(liveSource).merge(keepAlive)

            Future.successful(
              Ok.chunked(out)
                .as("text/event-stream")
                .withHeaders(
                  "Cache-Control" -> "no-cache",
                  "Connection" -> "keep-alive",
                  "X-Accel-Buffering" -> "no"
                )
                .addingToSession("sid" -> sid.value)
            )
        }
    }
  }

  override def comet(lastEventId: Long): Action[AnyContent] = Action.async { implicit req =>
    requireOnlineAuth(req) match {
      case Left(res) =>
        Future.successful(res)

      case Right((principal, _token)) =>
        sidFromQuery(req) match {
          case Left(res) => Future.successful(res)

          case Right(sid) =>
            val infoOpt: Option[SessionInfo] = sessionRepo.get(sid)

            def snapshotJson: Option[String] =
              ctxRepo.get(sid).map { ctx =>
                val web: WebGameState =
                  viewStateMapper.toWebState(ctx, Some(principal), infoOpt)

                Json.stringify(Json.obj("eventId" -> 0L, "state" -> Json.toJson(web)))
              }

            def encode(events: Seq[GameEvent]): String =
              events.map { ev =>
                val web: WebGameState =
                  viewStateMapper.toWebState(ev.ctx, Some(principal), infoOpt)

                Json.stringify(
                  Json.obj(
                    "eventId" -> ev.eventId,
                    "state"   -> Json.toJson(web),
                    "meta"    -> ev.meta
                  )
                )
              }.mkString("\n")

            val pending = eventHub.getSince(sid, lastEventId)

            if (pending.nonEmpty) {
              Future.successful(
                Ok(encode(pending))
                  .as("application/json")
                  .addingToSession("sid" -> sid.value)
              )
            } else snapshotJson match {
              case Some(snap) =>
                Future.successful(
                  Ok(snap)
                    .as("application/json")
                    .addingToSession("sid" -> sid.value)
                )

              case None =>
                val p = Promise[Result]()
                var unsubscribe: () => Unit = () => ()

                unsubscribe =
                  eventHub.subscribe(sid) { ev =>
                    if (ev.eventId > lastEventId && !p.isCompleted) {
                      val all = eventHub.getSince(sid, lastEventId)
                      p.trySuccess(
                        Ok(encode(all))
                          .as("application/json")
                          .addingToSession("sid" -> sid.value)
                      )
                      unsubscribe()
                    }
                  }

                system.scheduler.scheduleOnce(25.seconds) {
                  if (!p.isCompleted) {
                    val res =
                      snapshotJson
                        .map(snap => Ok(snap).as("application/json"))
                        .getOrElse(Ok("").as("application/json"))

                    p.trySuccess(res.addingToSession("sid" -> sid.value))
                  }
                  unsubscribe()
                }(ec)

                p.future
            }
        }
    }
  }
}
