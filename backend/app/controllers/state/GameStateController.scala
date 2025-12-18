package app.controllers.state

import javax.inject._
import play.api.libs.json._
import play.api.mvc._
import scala.concurrent.ExecutionContext

import controllers.support.ControllerSupport
import app.api.usecases.IGameUseCases

@Singleton
final class GameStateController @Inject()(
  cc: ControllerComponents,
  gameUseCases: IGameUseCases
)(implicit ec: ExecutionContext)
  extends AbstractController(cc)
  with ControllerSupport
  with IGameStateController {

  private val JSON = "application/json"

  override def state: Action[AnyContent] = Action { implicit req =>
    requirePrincipal(req) match {
      case Left(res) => res
      case Right(_) =>
        val sid = getOrCreateSid(req)
        gameUseCases.state(sid) match {
          case Left(err)  => NotFound(Json.obj("error" -> err.message)).as(JSON).addingToSession("sid" -> sid.value)
          case Right(web) => Ok(Json.toJson(web)).as(JSON).addingToSession("sid" -> sid.value)
        }
    }
  }
}
