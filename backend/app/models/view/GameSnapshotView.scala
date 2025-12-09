package app.models.view

import app.models.state.WebGameState
import play.api.libs.json._

final case class GameSnapshotView(
  eventId: Long,
  state: WebGameState
)
object GameSnapshotView {
  implicit val writes: OWrites[GameSnapshotView] = Json.writes[GameSnapshotView]
}
