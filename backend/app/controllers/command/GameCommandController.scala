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

  private def sidFromQuery(req: RequestHeader): Either[Result, GameSessionId] =
    req.getQueryString("sid").map(_.trim).filter(_.nonEmpty) match {
      case Some(raw) => Right(GameSessionId(raw))
      case None      => Left(BadRequest(Json.obj("error" -> "Missing sid query param")).as(JSON))
    }

  override def command: Action[JsValue] =
    Action(parse.json).async { implicit req =>
      val mode = CommandMode.from(readMode(req.body))

      val sidEither: Either[Result, GameSessionId] =
        mode match {
          case CommandMode.online => sidFromQuery(req)
          case CommandMode.local  => Right(getOrCreateLocalSid(req))
        }

      sidEither match {
        case Left(res) =>
          Future.successful(res)

        case Right(sid) =>
          val authEither: Either[Result, (Option[AuthPrincipal], Option[PlayerToken])] =
            mode match {
              case CommandMode.local =>
                val pid = readPlayerId(req.body).getOrElse("local")
                val p = AuthPrincipal(userId = "local", email = None, nickname = Some(pid))
                Right((Some(p), None))

              case CommandMode.online =>
                given SupabaseJwt = jwt
                (requirePrincipal(req), requirePlayerToken(req)) match {
                  case (Left(res), _) => Left(res.as(JSON))
                  case (_, Left(res)) => Left(res.as(JSON))
                  case (Right(p), Right(t)) =>
                    Right((Some(p), Some(t)))
                }
            }

          val res0: Result =
            authEither match {
              case Left(res) =>
                res.as(JSON)

              case Right((principalOpt, tokenOpt)) =>
                decoder.fromRestJson(req.body) match {
                  case Left(err) =>
                    BadRequest(Json.obj("error" -> err.message)).as(JSON)

                  case Right(cmd) =>
                    facade.execute(mode, sid, principalOpt, cmd, tokenOpt) match {
                      case Left(appErr) =>
                        BadRequest(Json.obj("error" -> appErr.message)).as(JSON)

                      case Right(web) =>
                        Ok(Json.toJson(web)).as(JSON)
                    }
                }
            }

          val res =
            mode match {
              case CommandMode.local  => ensureLocalSid(req, res0, sid)
              case CommandMode.online => ensureSid(req, res0, sid)
            }

          Future.successful(res)
      }
    }
}
