package app.controllers.auth

import javax.inject._
import play.api.libs.json._
import play.api.mvc._
import app.controllers.support.ControllerSupport

@Singleton
final class AuthApiController @Inject()(cc: ControllerComponents)
  extends AbstractController(cc)
    with ControllerSupport {

  /** Returns session auth status */
  def me(): Action[AnyContent] = Action { implicit req =>
    req.session.get("username") match {
      case Some(u) => Ok(Json.obj("loggedIn" -> true, "username" -> u))
      case None    => Ok(Json.obj("loggedIn" -> false))
    }
  }

  /** Dev auth: accept any non-empty username (password optional for now) */
  def login(): Action[JsValue] = Action(parse.json) { implicit req =>
    val username = (req.body \ "username").asOpt[String].getOrElse("").trim
    val password = (req.body \ "password").asOpt[String].getOrElse("").trim

    if (username.isEmpty) {
      BadRequest(Json.obj("error" -> "Username required"))
    } else {
      // Ensure sid exists too (helps WS/SSE)
      val sid = getOrCreateSid(req)

      Ok(Json.obj("loggedIn" -> true, "username" -> username))
        .addingToSession("username" -> username, "sid" -> sid.value)
    }
  }

  def logout(): Action[AnyContent] = Action { _ =>
    Ok(Json.obj("loggedIn" -> false)).withNewSession
  }
}
