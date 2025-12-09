package app.models.view

import play.api.libs.json._

final case class RegularAttackCommandView(
  target: String,
  index: Option[Int]
)
object RegularAttackCommandView {
  implicit val format: OFormat[RegularAttackCommandView] = Json.format[RegularAttackCommandView]
}