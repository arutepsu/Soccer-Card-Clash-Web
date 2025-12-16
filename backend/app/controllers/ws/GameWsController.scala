package app.controllers.ws

import javax.inject._
import scala.concurrent.{ExecutionContext, Future}

import akka.stream.Materializer
import akka.stream.OverflowStrategy
import akka.stream.scaladsl.{Flow, Sink, Source}
import play.api.libs.json._
import play.api.mvc._
import akka.NotUsed
import akka.stream.scaladsl.{Source, SourceQueueWithComplete}
import controllers.support.ControllerSupport
import app.controllers.ws.IGameWsController
import app.api.command.{GameCommandDecoder, IGameCommandFacade}
import app.api.protocol.{Envelope, MessageTypes}
import app.models.AppError
import app.models.state.WebGameState
import app.session.GameSessionId

@Singleton
final class GameWsController @Inject()(
  cc: ControllerComponents,
  decoder: GameCommandDecoder,
  facade: IGameCommandFacade
)(implicit ec: ExecutionContext, mat: Materializer)
  extends AbstractController(cc)
    with ControllerSupport
    with IGameWsController {

    override def ws: WebSocket =
    WebSocket.acceptOrResult[JsValue, JsValue] { req =>
        requirePrincipal(req) match {
        case Left(res) => Future.successful(Left(res))

        case Right(principalOpt) =>
            req.session.get("sid") match {
            case None =>
                Future.successful(Left(Unauthorized("Missing sid in session")))

            case Some(rawSid) =>
                val sid = GameSessionId(rawSid)

                val (queue, src): (SourceQueueWithComplete[JsValue], Source[JsValue, NotUsed]) =
                Source.queue[JsValue](64, OverflowStrategy.dropHead).preMaterialize()

                val sink: Sink[JsValue, _] =
                Sink.foreach[JsValue] { js =>
                    js.validate[Envelope] match {
                    case JsError(_) => ()
                    case JsSuccess(env, _) =>
                        val envWithSid = env.copy(gameId = sid.value)

                        decoder.fromEnvelope(envWithSid) match {
                        case Left(err) =>
                            queue.offer(Json.toJson(errorEnvelope(envWithSid, sid, err)))

                        case Right(cmd) =>
                            facade.execute(sid, principalOpt, cmd, envWithSid.requestId) match {
                            case Left(err) =>
                                queue.offer(Json.toJson(errorEnvelope(envWithSid, sid, err)))

                            case Right(web) =>
                                queue.offer(Json.toJson(stateEnvelope(envWithSid, sid, web)))
                            }
                        }
                    }
                }

                val flow = Flow.fromSinkAndSourceCoupled(sink, src)
                Future.successful(Right(flow))
            }
        }
    }


  private def stateEnvelope(
    in: Envelope,
    sid: GameSessionId,
    web: WebGameState
  ): Envelope =
    Envelope(
      kind      = "event",
      `type`    = MessageTypes.StateUpdated,
      gameId    = sid.value,
      requestId = in.requestId,
      payload   = Json.toJson(web)
    )

  private def errorEnvelope(
    in: Envelope,
    sid: GameSessionId,
    err: AppError
  ): Envelope =
    Envelope(
      kind      = "error",
      `type`    = MessageTypes.GameError,
      gameId    = sid.value,
      requestId = in.requestId,
      payload   = Json.toJson(err)
    )
}
