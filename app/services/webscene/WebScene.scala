// services/webscene/WebScene.scala
package services.webscene

import play.api.mvc.RequestHeader
import play.api.i18n.Messages
import play.twirl.api.Html

trait WebScene {
  def render()(implicit rh: RequestHeader, m: Messages): Html
  def activate(): Unit = ()
  def deactivate(): Unit = ()
}
