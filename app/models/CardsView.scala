package app.models
import play.api.libs.json._

final case class CardsView(
  attackerHand: Seq[CardView],
  defenderHand: Seq[CardView],
  attackerField: Seq[CardSlotView],
  defenderField: Seq[CardSlotView],
  attackerGoalkeeper: Option[CardView],
  defenderGoalkeeper: Option[CardView]
)

object CardsView {
  implicit val writes: OWrites[CardsView] = Json.writes[CardsView]
}