package app.models
import play.api.libs.json._

final case class CardView(
  id: String,
  rank: String,
  suit: String,
  value: Int,
  boosted: Boolean,
  fileName: String
)
object CardView {
  implicit val writes: OWrites[CardView] = Json.writes[CardView]
}