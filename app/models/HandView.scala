package app.models
import play.api.libs.json._

final case class HandView(cards: Seq[CardView])

object HandView {
  implicit val writes: OWrites[HandView] = Json.writes[HandView]
}