package app.controllers.command

import javax.inject._
import scala.concurrent.{ExecutionContext, Future}

import play.api.libs.json._
import play.api.mvc._

import app.controllers.support.ControllerSupport
import app.session.{GameSessionId, PlayerToken}
import app.api.command._
import app.auth.{AuthPrincipal, SupabaseJwt}

@Singleton
final class GameCommandController @Inject()(
  cc: ControllerComponents,
  decoder: GameCommandDecoder,
  facade: IGameCommandFacade,
  jwt: SupabaseJwt
)(implicit ec: ExecutionContext)
  extends AbstractController(cc)
    with ControllerSupport
    with IGameCommandController {

  private val JSON = "application/json"

  private def readMode(body: JsValue): String =
    (body \ "mode").asOpt[String].map(_.trim.toLowerCase).getOrElse("local")

  private def readPlayerId(body: JsValue): Option[String] =
    (body \ "playerId").asOpt[String].map(_.trim).filter(_.nonEmpty)

  private def sidFromQueryOrSession(req: RequestHeader): Either[Result, GameSessionId] =
    req.getQueryString("sid").map(_.trim).filter(_.nonEmpty) match {
      case Some(raw) => Right(GameSessionId(raw))
      case None      => requireSid(req)
    }

  override def command: Action[JsValue] =
    Action(parse.json).async { implicit req =>
      val mode = CommandMode.from(readMode(req.body))

      val sidEither: Either[Result, GameSessionId] =
        if (mode == CommandMode.online) sidFromQueryOrSession(req)
        else Right(getOrCreateLocalSid(req))

      sidEither match {
        case Left(res) =>
          Future.successful(res.as(JSON))

        case Right(sid) =>
          def persistSid(res: Result): Result =
            if (mode == CommandMode.online) res.addingToSession("sid" -> sid.value)
            else res.addingToSession("localSid" -> sid.value)

          val authEither: Either[Result, (Option[AuthPrincipal], Option[PlayerToken])] =
            mode match {
              case CommandMode.local =>
                val pid = readPlayerId(req.body).getOrElse("local")
                val p = AuthPrincipal(userId = "local", email = None, nickname = Some(pid))
                Right((Some(p), None))

              case CommandMode.online =>
                given SupabaseJwt = jwt
                (requirePrincipal(req), requirePlayerToken(req)) match {
                  case (Left(res), _) => Left(res)
                  case (_, Left(res)) => Left(res)
                  case (Right(p), Right(t)) =>
                    Right((Some(p), Some(t)))
                }
            }

          authEither match {
            case Left(res) =>
              Future.successful(persistSid(res.as(JSON)))

            case Right((principalOpt, tokenOpt)) =>
              decoder.fromRestJson(req.body) match {
                case Left(err) =>
                  Future.successful(
                    persistSid(BadRequest(Json.obj("error" -> err.message)).as(JSON))
                  )

                case Right(cmd) =>
                  facade.execute(mode, sid, principalOpt, cmd, tokenOpt) match {
                    case Left(appErr) =>
                      Future.successful(
                        persistSid(BadRequest(Json.obj("error" -> appErr.message)).as(JSON))
                      )

                    case Right(web) =>
                      Future.successful(
                        persistSid(Ok(Json.toJson(web)).as(JSON))
                      )
                  }
              }
          }
      }
    }
}
