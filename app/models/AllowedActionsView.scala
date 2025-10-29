package app.models

import play.api.libs.json._

final case class ActionLimitsView(
  swapRemaining: Int,
  boostRemaining: Int,
  doubleAttackRemaining: Int
)
object ActionLimitsView {
  implicit val writes: OWrites[ActionLimitsView] = Json.writes[ActionLimitsView]
}

final case class AllowedActionsView(
  attacker: ActionLimitsView,
  defender: ActionLimitsView
)
object AllowedActionsView {
  implicit val writes: OWrites[AllowedActionsView] = Json.writes[AllowedActionsView]
}
