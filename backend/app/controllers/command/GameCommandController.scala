package app.controllers.command


import javax.inject._
import scala.concurrent.{ExecutionContext, Future}
import play.api.libs.json._
import play.api.mvc._

import controllers.support.ControllerSupport
import app.api.command.{IGameCommandFacade, GameCommandDecoder}
import app.controllers.command.IGameCommandController

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

  override def command: Action[JsValue] =
    Action(parse.json).async { implicit req =>
      val sid = getOrCreateSid(req)
      val principal = principalOpt(req)

      decoder.fromRestJson(req.body) match {
        case Left(err) =>
          Future.successful(
            BadRequest(Json.obj("error" -> err.message))
              .as(JSON)
              .addingToSession("sid" -> sid.value)
          )

        case Right(cmd) =>
          facade.execute(sid, principal, cmd, None) match {
            case Left(appErr) =>
              Future.successful(
                BadRequest(Json.obj("error" -> appErr.message))
                  .as(JSON)
                  .addingToSession("sid" -> sid.value)
              )

            case Right(web) =>
              Future.successful(
                Ok(Json.toJson(web))
                  .as(JSON)
                  .addingToSession("sid" -> sid.value)
              )
          }
      }
    }
}
