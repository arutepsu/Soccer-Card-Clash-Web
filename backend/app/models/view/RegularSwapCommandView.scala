package app.models.view

import play.api.libs.json._

final case class RegularSwapCommandView(
  index: Int
)
object RegularSwapCommandView {
  implicit val format: OFormat[RegularSwapCommandView] = Json.format[RegularSwapCommandView]
}
