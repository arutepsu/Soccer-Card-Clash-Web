package app.controllers.ws

import play.api.mvc.WebSocket

trait IGameWsController {
  def ws: WebSocket
}
