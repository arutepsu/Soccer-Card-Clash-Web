package app.models
import play.api.libs.json._

final case class CardSlotView(
  id: String,
  card: Option[CardView]
)

object CardSlotView {
  implicit val writes: OWrites[CardSlotView] = Json.writes[CardSlotView]
}