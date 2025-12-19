package app.models.view

import play.api.libs.json._

enum PlayerSide:
  case attacker, defender

object PlayerSide:
  given Writes[PlayerSide] = Writes(s => JsString(s.toString))

final case class YouView(
  userId: String,
  username: String,
  side: PlayerSide,
  isAttacker: Boolean
)

object YouView:
  given Writes[YouView] = Json.writes[YouView]