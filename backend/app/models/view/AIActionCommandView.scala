package app.models.view

import play.api.libs.json._

final case class AIActionCommandView(
  kind: String,
  defenderIndex: Option[Int] = None,
  handIndex: Option[Int]    = None,
  zone: Option[String]      = None
)

object AIActionCommandView {
  implicit val format: OFormat[AIActionCommandView] =
    Json.format[AIActionCommandView]
}
