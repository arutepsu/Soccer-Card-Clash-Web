package app.controllers.command

import play.api.mvc.Action
import play.api.libs.json.JsValue

trait IGameCommandController {
  def command: Action[JsValue]
}
