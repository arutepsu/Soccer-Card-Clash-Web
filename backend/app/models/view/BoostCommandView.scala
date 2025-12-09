package app.models.view

import play.api.libs.json._

final case class BoostCommandView(
  target: String,
  index: Option[Int]
)
object BoostCommandView {
  implicit val format: OFormat[BoostCommandView] = Json.format[BoostCommandView]
}