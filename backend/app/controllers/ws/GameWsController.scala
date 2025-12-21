package app.controllers.ws

import javax.inject._
import scala.concurrent.{ExecutionContext, Future}
import scala.util.control.NonFatal

import akka.stream.scaladsl.Flow
import play.api.libs.json._
import play.api.mvc._
import play.api.Configuration

import app.auth.AuthPrincipal
import app.controllers.support.ControllerSupport
import app.api.command.{GameCommandDecoder, IGameCommandFacade, CommandMode}
import app.api.protocol.{Envelope, MessageTypes}
import app.models.AppError
import app.models.state.WebGameState
import app.session.GameSessionId

@Singleton
final class GameWsController @Inject()(
  cc: ControllerComponents,
  decoder: GameCommandDecoder,
  facade: IGameCommandFacade,
  config: Configuration
)(implicit ec: ExecutionContext)
  extends AbstractController(cc)
    with ControllerSupport
    with IGameWsController {

  given Configuration = config

  override def ws: WebSocket =
    WebSocket.acceptOrResult[JsValue, JsValue] { req =>
      (for {
        sid <- requireSid(req)
        p   <- principalOrAnonymous(req)
      } yield (sid, p)) match {
        case Left(res) => Future.successful(Left(res))
        case Right((sid, principal)) =>
          val flow = Flow[JsValue]
            .map(_.validate[Envelope].asOpt)
            .collect { case Some(env) => env }
            .map(env => env.copy(gameId = sid.value))
            .mapAsync(1)(env => handle(env, sid, Some(principal)))

          Future.successful(Right(flow))
      }
    }

  private def handle(
    env: Envelope,
    sid: GameSessionId,
    principalOpt: Option[AuthPrincipal]
  ): Future[JsValue] = {

    decoder.fromEnvelope(env) match {
      case Left(err) =>
        Future.successful(Json.toJson(errorEnvelope(env, sid, err)))

      case Right(cmd) =>
        try {
          facade.execute(CommandMode.online, sid, principalOpt, cmd, None) match {
            case Left(appErr) =>
              Future.successful(Json.toJson(errorEnvelope(env, sid, appErr)))

            case Right(web) =>
              Future.successful(Json.toJson(stateEnvelope(env, sid, web)))
          }
        } catch {
          case NonFatal(t) =>
            Future.successful(
              Json.toJson(
                errorEnvelope(
                  env,
                  sid,
                  AppError(Option(t.getMessage).getOrElse("WS execute failed"))
                )
              )
            )
        }
    }
  }

  private def stateEnvelope(in: Envelope, sid: GameSessionId, web: WebGameState): Envelope =
    Envelope(
      kind      = "event",
      `type`    = MessageTypes.StateUpdated,
      gameId    = sid.value,
      requestId = in.requestId,
      payload   = Json.toJson(web)
    )

  private def errorEnvelope(in: Envelope, sid: GameSessionId, err: AppError): Envelope =
    Envelope(
      kind      = "error",
      `type`    = MessageTypes.GameError,
      gameId    = sid.value,
      requestId = in.requestId,
      payload   = Json.toJson(err)
    )
}
