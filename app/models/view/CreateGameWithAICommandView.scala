package app.models.view

import play.api.libs.json._

final case class CreateGameWithAICommandView(
  humanPlayer: String,
  aiName: String
)
object CreateGameWithAICommandView {
  implicit val format: OFormat[CreateGameWithAICommandView] = Json.format[CreateGameWithAICommandView]
}
