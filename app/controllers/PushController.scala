package controllers

import javax.inject._
import akka.actor.ActorSystem
import akka.stream.Materializer
import akka.stream.scaladsl.{Flow, Sink, Source}
import app.models._
import app.services.IGamePushService
import play.api.libs.EventSource
import play.api.libs.json._
import play.api.mvc._
import app.protocol.Envelope
import scala.concurrent.{ExecutionContext, Future}

@Singleton
class GamePushController @Inject()(
  cc: ControllerComponents,
  gamePush: IGamePushService
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
      val src: Source[JsValue, _] =
        gamePush.eventStream(sid).map(env => Json.toJson(env))

      Future.successful(
        Ok.chunked(src via EventSource.flow).as("text/event-stream")
      )
    }
  }

  def cometEvents(lastEventId: Long): Action[AnyContent] = Action.async { implicit req =>
    sidOrResultResult(req) { sid =>
      val src: Source[Envelope, _] =
        gamePush
          .eventStream(sid)
          .filter(env =>
            (env.payload \ "eventId").asOpt[Long].exists(_ > lastEventId)
          )
          .take(20)

      Future.successful(
        Ok.chunked(src.map(env => Json.toJson(env)))
      )
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
