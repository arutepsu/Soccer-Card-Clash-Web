package app.controllers.ui

import play.api.mvc.{Action, AnyContent}

trait ISpaController {
  def index: Action[AnyContent]
}
