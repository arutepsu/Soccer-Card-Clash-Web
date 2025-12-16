package app.controllers.auth

import javax.inject._
import play.api.mvc._
import play.api.i18n._

@Singleton
final class AuthController @Inject()(cc: MessagesControllerComponents)
  extends MessagesAbstractController(cc)
  with IAuthController {

  override def loginPage(): Action[AnyContent] =
    Action { implicit req =>
      Ok(views.html.index())
    }

  override def doLogin(): Action[AnyContent] = Action { implicit req =>
    val data = req.body.asFormUrlEncoded.getOrElse(Map.empty)
    val username = data.get("username").flatMap(_.headOption).getOrElse("")
    val password = data.get("password").flatMap(_.headOption).getOrElse("")

    if (username.isEmpty || password.isEmpty) {
      Redirect(app.controllers.auth.routes.AuthController.loginPage())
        .flashing("error" -> "Username and password required")
    } else {
      Redirect(app.controllers.ui.routes.SpaController.index())
        .withSession(req.session + ("username" -> username))
        .flashing("info" -> s"Welcome, $username")
    }
  }

  override def logout(): Action[AnyContent] =
    Action { implicit req =>
      Redirect(app.controllers.auth.routes.AuthController.loginPage()).withNewSession
    }
}
