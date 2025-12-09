package app.models.view

import play.api.libs.json._

final case class CreateGameCommandView(
  p1: String,
  p2: String
)
object CreateGameCommandView {
  implicit val format: OFormat[CreateGameCommandView] = Json.format[CreateGameCommandView]
}
