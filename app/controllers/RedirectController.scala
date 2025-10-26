// app/controllers/RedirectController.scala
package controllers

import javax.inject.*
import play.api.mvc.*

@Singleton
class RedirectController @Inject()(cc: ControllerComponents)
  extends AbstractController(cc) {

  def rootToGame: Action[AnyContent] = Action {
    Redirect(routes.UiController.mainMenu())
  }
}
