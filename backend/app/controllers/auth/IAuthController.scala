package app.controllers.auth

import play.api.mvc.{Action, AnyContent}

trait IAuthController {
  def loginPage(): Action[AnyContent]
  def doLogin(): Action[AnyContent]
  def logout(): Action[AnyContent]
}
