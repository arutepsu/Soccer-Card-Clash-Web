package app.controllers.state

import play.api.mvc.{Action, AnyContent}

trait IGameStateController {
  def state: Action[AnyContent]
}
