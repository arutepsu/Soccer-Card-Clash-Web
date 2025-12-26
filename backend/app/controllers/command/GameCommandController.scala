package app.controllers.command

import javax.inject._
import scala.concurrent.{ExecutionContext, Future}
import play.api.libs.json._
import play.api.mvc._

import app.controllers.support.ControllerSupport
import app.api.command.{IGameCommandFacade, GameCommandDecoder, CommandMode}
import app.controllers.command.IGameCommandController
import app.session.GameSessionId

@Singleton
final class GameCommandController @Inject()(
  cc: ControllerComponents,
  decoder: GameCommandDecoder,
  facade: IGameCommandFacade
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
        case Left(res) => Future.successful(res.as(JSON))

        case Right(sid) =>
          def persistSid(res: Result): Result =
            if (mode == CommandMode.online) res.addingToSession("sid" -> sid.value)
            else res.addingToSession("localSid" -> sid.value)

          val principal =
            mode match {
              case CommandMode.local =>
                val pid = readPlayerId(req.body).getOrElse("local")
                Some(app.auth.AuthPrincipal(userId = "local", username = pid))
              case CommandMode.online =>
                principalOpt(req)
            }

          decoder.fromRestJson(req.body) match {
            case Left(err) =>
              Future.successful(
                persistSid(BadRequest(Json.obj("error" -> err.message)).as(JSON))
              )

            case Right(cmd) =>
              facade.execute(mode, sid, principal, cmd, None) match {
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
