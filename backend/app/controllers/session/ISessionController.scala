package app.controllers.session

import play.api.mvc.*
import app.auth.AuthPrincipal
import app.session.GameSessionId
import app.session.GameSessionError

trait ISessionController {

  def list: Action[AnyContent]

  def create: Action[play.api.libs.json.JsValue]

  def get(id: String): Action[AnyContent]

  def join(id: String): Action[play.api.libs.json.JsValue]

  def leave(id: String): Action[AnyContent]

  def start(id: String): Action[AnyContent]

}
