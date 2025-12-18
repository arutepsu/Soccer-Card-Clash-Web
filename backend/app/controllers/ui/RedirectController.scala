package app.controllers.ui

import javax.inject.*
import play.api.mvc.*
import app.controllers.auth.AuthController

@Singleton
final class RedirectController @Inject()(cc: ControllerComponents)
  extends AbstractController(cc) {

  def root: Action[AnyContent] = Action {
    Redirect(app.controllers.auth.routes.AuthController.loginPage())
  }

}
