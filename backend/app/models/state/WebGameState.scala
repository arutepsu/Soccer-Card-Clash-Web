package app.models.state

import play.api.libs.json._
import app.models.view._

final case class WebGameState(
  roles: RolesView,
  scores: ScoresView,
  cards: CardsView,
  allowed: AllowedActionsView,
  you: Option[YouView]
)

object WebGameState {
  implicit val writes: OWrites[WebGameState] = Json.writes[WebGameState]
}