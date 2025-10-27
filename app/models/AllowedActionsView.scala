package app.models

final case class AllowedActionsView(
  attacker: ActionLimitsView,
  defender: ActionLimitsView
)

final case class ActionLimitsView(
  swapRemaining: Int,
  boostRemaining: Int,
  doubleAttackRemaining: Int
)
