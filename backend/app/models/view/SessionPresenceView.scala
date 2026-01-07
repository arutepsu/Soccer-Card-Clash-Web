// app/models/view/SessionPresenceView.scala
package app.models.view

import play.api.libs.json._

final case class SessionPresenceView(
  hostConnected: Boolean,
  guestConnected: Boolean
)

object SessionPresenceView {
  implicit val fmt: OFormat[SessionPresenceView] = Json.format[SessionPresenceView]
}
