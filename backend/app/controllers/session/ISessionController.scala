package app.controllers.session

import play.api.mvc.*

trait ISessionController {

  def list: Action[AnyContent]

  def create: Action[play.api.libs.json.JsValue]

  def get(id: String): Action[AnyContent]

  def join(id: String): Action[play.api.libs.json.JsValue]

  def leave(id: String): Action[AnyContent]
}
