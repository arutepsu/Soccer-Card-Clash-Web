package app.models
import play.api.libs.json._

final case class PlayerView(name: String)

object PlayerView {
  implicit val writes: OWrites[PlayerView] = Json.writes[PlayerView]
}