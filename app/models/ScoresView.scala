package app.models
import play.api.libs.json._

final case class ScoresView(attacker: Int, defender: Int)

object ScoresView {
  implicit val writes: OWrites[ScoresView] = Json.writes[ScoresView]
}