package app.models
import play.api.libs.json._

final case class RolesView(attacker: String, defender: String)

object RolesView {
  implicit val writes: OWrites[RolesView] = Json.writes[RolesView]
}
