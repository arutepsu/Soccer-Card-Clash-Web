package app.models

final case class CardsView(
  attackerHand: Seq[CardView],
  defenderHand: Seq[CardView],
  attackerField: Seq[CardSlotView],
  defenderField: Seq[CardSlotView],
  attackerGoalkeeper: Option[CardView],
  defenderGoalkeeper: Option[CardView]
)
