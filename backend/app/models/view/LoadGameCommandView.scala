package app.models.view

import app.models.state.WebGameState
import play.api.libs.json._

final case class LoadGameCommandView(
  fileName: String
)
object LoadGameCommandView {
  implicit val format: OFormat[LoadGameCommandView] = Json.format[LoadGameCommandView]
}