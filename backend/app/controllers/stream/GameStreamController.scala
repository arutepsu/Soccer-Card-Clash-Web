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
import app.controllers.stream.IGameStreamController
import app.api.eventHub.{GameEvent, GameEventHub}
import app.auth.AuthPrincipal
import app.session.{GameSessionId, SessionInfo}
import app.session.repositories.IGameSessionRepository
import app.models.state.WebGameState

@Singleton
final class GameStreamController @Inject()(
  cc: ControllerComponents,
  eventHub: GameEventHub,
  viewStateMapper: IViewStateMapper,
  sessionRepo: IGameSessionRepository
)(implicit ec: ExecutionContext, system: ActorSystem, mat: Materializer)
  extends AbstractController(cc)
  with ControllerSupport
  with IGameStreamController {

  override def sse: Action[AnyContent] = Action.async { implicit req =>
    requirePrincipal(req) match {
      case Left(res) => Future.successful(res)
      case Right(principal) =>
        requireSid(req) match {
          case Left(res) => Future.successful(res)
          case Right(sid) =>
            val (queue, src) =
              Source.queue[GameEvent](32, OverflowStrategy.dropHead).preMaterialize()

            val unsubscribe = eventHub.subscribe(sid) { ev =>
              queue.offer(ev); ()
            }
            queue.watchCompletion().foreach(_ => unsubscribe())(ec)

            val infoOpt = sessionRepo.get(sid)
            val eventSource =
              src.map { ev =>
                val web = viewStateMapper.toWebState(ev.ctx, Some(principal), infoOpt)
                val json = Json.obj("eventId" -> ev.eventId, "state" -> Json.toJson(web))
                ByteString(s"data: ${Json.stringify(json)}\n\n")
              }

            Future.successful(
              Ok.chunked(eventSource)
                .as("text/event-stream")
            )
        }
    }
  }


  override def comet(lastEventId: Long): Action[AnyContent] = Action.async { implicit req =>
    requirePrincipal(req) match {
      case Left(res) => Future.successful(res)

      case Right(principal) =>
        val sid = getOrCreateSid(req)

        val infoOpt: Option[SessionInfo] = sessionRepo.get(sid)

        val pending = eventHub.getSince(sid, lastEventId)

        def encode(events: Seq[GameEvent]): String =
          events.map { ev =>
            val web: WebGameState =
              viewStateMapper.toWebState(ev.ctx, Some(principal), infoOpt)

            Json.stringify(Json.obj(
              "eventId" -> ev.eventId,
              "state"   -> Json.toJson(web)
            ))
          }.mkString("\n")

        if (pending.nonEmpty) {
          Future.successful(
            Ok(encode(pending))
              .as("application/json")
              .addingToSession("sid" -> sid.value)
          )
        } else {
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
            if (!p.isCompleted)
              p.trySuccess(Ok("").as("application/json").addingToSession("sid" -> sid.value))
            unsubscribe()
          }(ec)

          p.future
        }
    }
  }
}
