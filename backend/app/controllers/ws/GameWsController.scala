package app.controllers.ws

import javax.inject._
import scala.concurrent.{ExecutionContext, Future}
import scala.util.control.NonFatal

import akka.stream.scaladsl.Flow
import play.api.libs.json._
import play.api.mvc._

import app.auth.{AuthPrincipal, SupabaseJwt}
import app.controllers.support.ControllerSupport
import app.api.command.{GameCommandDecoder, IGameCommandFacade, CommandMode}
import app.api.protocol.{Envelope, MessageTypes}
import app.models.AppError
import app.models.state.WebGameState
import app.session.{GameSessionId, PlayerToken}

import app.api.eventHub.GameEventHub
import app.api.context.IGameContextRepository

@Singleton
final class GameWsController @Inject()(
  cc: ControllerComponents,
  decoder: GameCommandDecoder,
  facade: IGameCommandFacade,
  eventHub: GameEventHub,
  ctxRepo: IGameContextRepository,
  jwt: SupabaseJwt
)(implicit ec: ExecutionContext)
  extends AbstractController(cc)
    with ControllerSupport
    with IGameWsController {

  private def metaFromEnvelope(env: Envelope): JsObject = {
    env.`type` match {
      case MessageTypes.RegularAttack | "SingleAttack" =>
        val target = (env.payload \ "target").asOpt[String].getOrElse("defender").toLowerCase
        val idx    = (env.payload \ "index").asOpt[Int].getOrElse(-1)
        val defenderIndex = if (target == "goalkeeper") -1 else idx
        Json.obj("action" -> MessageTypes.RegularAttack, "defenderIndex" -> defenderIndex)

      case MessageTypes.DoubleAttack =>
        val target = (env.payload \ "target").asOpt[String].getOrElse("defender").toLowerCase
        val idx    = (env.payload \ "index").asOpt[Int].getOrElse(-1)
        val defenderIndex = if (target == "goalkeeper") -1 else idx
        Json.obj("action" -> MessageTypes.DoubleAttack, "defenderIndex" -> defenderIndex)

      case MessageTypes.Undo =>
        Json.obj("action" -> MessageTypes.Undo)

      case MessageTypes.Redo =>
        Json.obj("action" -> MessageTypes.Redo)

      case MessageTypes.Boost =>
        val target = (env.payload \ "target").asOpt[String].getOrElse("defender").toLowerCase
        val idx    = (env.payload \ "index").asOpt[Int].getOrElse(-1)
        val defenderIndex = if (target == "goalkeeper") -1 else idx
        Json.obj("action" -> MessageTypes.Boost, "defenderIndex" -> defenderIndex)

      case MessageTypes.RegularSwap | "Swap" =>
        val idx = (env.payload \ "index").asOpt[Int].getOrElse(-1)
        Json.obj("action" -> MessageTypes.RegularSwap, "handIndex" -> idx)

      case MessageTypes.ReverseSwap =>
        Json.obj("action" -> MessageTypes.ReverseSwap)

      case MessageTypes.ExecuteAI =>
        Json.obj("action" -> MessageTypes.ExecuteAI)

      case _ =>
        Json.obj()
    }
  }

  private def sidFromQueryOrSession(req: RequestHeader): Either[Result, GameSessionId] =
    req.getQueryString("sid").map(_.trim).filter(_.nonEmpty) match {
      case Some(raw) => Right(GameSessionId(raw))
      case None      => requireSid(req)
    }

  private def requireWsAuth(req: RequestHeader): Either[Result, (AuthPrincipal, PlayerToken)] =
    (requireSessionPrincipal(req), requirePlayerToken(req)) match {
      case (Left(res), _)           => Left(res)
      case (_, Left(res))           => Left(res)
      case (Right(p), Right(token)) => Right((p, token))
    }


  override def ws: WebSocket =
    WebSocket.acceptOrResult[JsValue, JsValue] { req =>
      sidFromQueryOrSession(req) match {
        case Left(res) =>
          Future.successful(Left(res))

        case Right(sid) =>
          requireWsAuth(req) match {
            case Left(res) => Future.successful(Left(res))
            case Right((principal, playerToken)) =>
              val flow =
                Flow[JsValue]
                  .map(_.validate[Envelope].asOpt)
                  .collect { case Some(env) => env }
                  .map(env => env.copy(gameId = sid.value))
                  .mapAsync(1)(env => handle(env, sid, principal, playerToken))

              Future.successful(Right(flow))
          }
      }
    }

  private def handle(
    env: Envelope,
    sid: GameSessionId,
    principal: AuthPrincipal,
    token: PlayerToken
  ): Future[JsValue] = {

    decoder.fromEnvelope(env) match {
      case Left(err) =>
        Future.successful(Json.toJson(errorEnvelope(env, sid, err)))

      case Right(cmd) =>
        try {
          val meta = metaFromEnvelope(env)

          facade.execute(
            mode      = CommandMode.online,
            sid       = sid,
            principal = Some(principal),
            cmd       = cmd,
            token     = Some(token),
            meta      = Some(meta)
          ) match {

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
      payload   = Json.toJson(web),
      meta      = Some(metaFromEnvelope(in))
    )

  private def errorEnvelope(in: Envelope, sid: GameSessionId, err: AppError): Envelope =
    Envelope(
      kind      = "error",
      `type`    = MessageTypes.GameError,
      gameId    = sid.value,
      requestId = in.requestId,
      payload   = Json.toJson(err),
      meta      = Some(metaFromEnvelope(in))
    )
}
