package app.controllers.state

import javax.inject._
import play.api.libs.json._
import play.api.mvc._
import scala.concurrent.ExecutionContext
import controllers.support.ControllerSupport
import app.api.usecases.IGameUseCases
import play.api.Configuration
import app.session.GameSessionId
import app.auth.AuthPrincipal

@Singleton
final class GameStateController @Inject()(
  cc: ControllerComponents,
  gameUseCases: IGameUseCases,
  config: Configuration
)(implicit ec: ExecutionContext)
  extends AbstractController(cc)
    with ControllerSupport
    with IGameStateController {

  private val JSON_CT = "application/json"

  override def state: Action[AnyContent] = Action { implicit req =>
    given Configuration = config

    principalOrAnonymous(req) match {
      case Left(res) => res

      case Right(principal) =>
        val sid = getOrCreateSid(req)

        gameUseCases.state(sid, Some(principal)) match {
          case Left(appErr) =>
            NotFound(Json.obj("error" -> appErr.message))
              .as(JSON_CT)
              .addingToSession("sid" -> sid.value)

          case Right(web) =>
            Ok(Json.toJson(web))
              .as(JSON_CT)
              .addingToSession("sid" -> sid.value)
        }
    }
  }
}
