package controllers

import javax.inject._
import akka.actor.ActorSystem
import akka.stream.Materializer
import akka.stream.scaladsl.{Flow, Sink, Source}
import app.models._
import scala.concurrent.Promise
import scala.concurrent.duration._
import akka.stream.scaladsl.Source
import app.api.push.IGamePushService
import play.api.libs.EventSource
import play.api.libs.json._
import play.api.mvc._
import app.api.push.protocol.Envelope
import scala.concurrent.{ExecutionContext, Future}
import app.api.services.GameEventHub
import app.api.services.GameEvent
import app.session.GameSessionId
@Singleton
class GamePushController @Inject()(
  cc: ControllerComponents,
  gamePush: IGamePushService,
  eventHub: GameEventHub,
)(implicit ec: ExecutionContext, system: ActorSystem, mat: Materializer)
  extends AbstractController(cc) {

  private def sidOrResultEither[A](req: RequestHeader)(
    f: String => Future[Either[Result, A]]
  ): Future[Either[Result, A]] =
    req.session.get("sid") match {
      case None =>
        Future.successful(Left(Unauthorized("No session id (sid) in cookie/session")))
      case Some(sid) =>
        f(sid)
    }

  private def sidOrResultResult(req: RequestHeader)(
    f: String => Future[Result]
  ): Future[Result] =
    req.session.get("sid") match {
      case None =>
        Future.successful(Unauthorized("No session id (sid) in cookie/session"))
      case Some(sid) =>
        f(sid)
    }

  def wsGame: WebSocket =
    WebSocket.acceptOrResult[JsValue, JsValue] { request =>
      sidOrResultEither[Flow[JsValue, JsValue, _]](request) { sid =>
        val sink: Sink[JsValue, _] =
          Sink.foreach[JsValue] { js =>
            val env     = js.as[Envelope]
            val withSid = env.copy(gameId = sid)
            gamePush.handleCommand(withSid)
          }

        val source: Source[JsValue, _] =
          gamePush.eventStream(sid).map(env => Json.toJson(env))

        Future.successful(
          Right(Flow.fromSinkAndSource(sink, source))
        )
      }
    }

  def sseEvents: Action[AnyContent] = Action.async { implicit req =>
    sidOrResultResult(req) { sid =>
      import akka.stream.scaladsl.Source
      import akka.stream.OverflowStrategy
      import akka.util.ByteString

      val (queue, src) =
        Source
          .queue[GameEvent](bufferSize = 32, OverflowStrategy.dropHead)
          .preMaterialize()
      val unsubscribe = eventHub.subscribe(GameSessionId(sid)) { ev =>
        queue.offer(ev)
        ()
      }

      queue.watchCompletion().foreach { _ =>
        unsubscribe()
      }(ec)

      val eventSource =
        src.map { ev =>
          val json = Json.obj(
            "eventId" -> ev.eventId,
            "state"   -> Json.toJson(ev.state)
          )
          ByteString(s"data: ${Json.stringify(json)}\n\n")
        }

      Future.successful(
        Ok.chunked(eventSource).as("text/event-stream")
      )
    }
  }

  def cometEvents(lastEventId: Long): Action[AnyContent] = Action.async { implicit req =>
    sidOrResultResult(req) { sid =>
      import scala.concurrent.Promise
      import scala.concurrent.duration._

      val sessionId = GameSessionId(sid)

      val pending = eventHub.getSince(sessionId, lastEventId)
      if (pending.nonEmpty) {
        val lines = pending.map { ev =>
          Json.stringify(
            Json.obj(
              "eventId" -> ev.eventId,
              "state"   -> Json.toJson(ev.state)
            )
          )
        }
        Future.successful(
          Ok(lines.mkString("\n")).as("application/json")
        )
      } else {
        val p = Promise[Result]()

        var unsubscribe: () => Unit = () => ()

        unsubscribe =
          eventHub.subscribe(sessionId) { ev =>
            if (ev.eventId > lastEventId && !p.isCompleted) {
              val all = eventHub.getSince(sessionId, lastEventId)
              val lines = all.map { e =>
                Json.stringify(
                  Json.obj(
                    "eventId" -> e.eventId,
                    "state"   -> Json.toJson(e.state)
                  )
                )
              }
              p.trySuccess(
                Ok(lines.mkString("\n")).as("application/json")
              )
              unsubscribe()
            }
          }

        system.scheduler.scheduleOnce(25.seconds) {
          if (!p.isCompleted) {
            p.trySuccess(Ok("").as("application/json"))
          }
          unsubscribe()
        }(ec)

        p.future
      }
    }
  }

  def postCommand(): Action[JsValue] = Action(parse.json).async { implicit req =>
    sidOrResultResult(req) { sid =>
      val env = req.body.as[Envelope]
      gamePush.handleCommand(env.copy(gameId = sid))
      Future.successful(Ok(Json.obj("status" -> "accepted")))
    }
  }
}
