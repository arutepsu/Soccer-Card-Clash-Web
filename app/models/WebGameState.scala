package app.models
import play.api.libs.json._

final case class WebGameState(
  roles: RolesView,
  scores: ScoresView,
  cards: CardsView,
  allowed: AllowedActionsView
)

object WebGameState {
  implicit val writes: OWrites[WebGameState] = Json.writes[WebGameState]
}