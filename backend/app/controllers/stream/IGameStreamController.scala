package app.controllers.stream

import play.api.mvc.Action
import play.api.mvc.AnyContent

trait IGameStreamController {
  def sse: Action[AnyContent]
  def comet(lastEventId: Long): Action[AnyContent]
}
