package app.models.state

import play.api.libs.json._
import app.models.view._

final case class WebGameState(
  roles: RolesView,
  scores: ScoresView,
  cards: CardsView,
  allowed: AllowedActionsView,
  you: Option[YouView],
  presence: Option[SessionPresenceView] = None
)

object WebGameState {
  implicit val writes: OWrites[WebGameState] = Json.writes[WebGameState]
}