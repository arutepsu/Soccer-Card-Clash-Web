package controllers.dto

import play.api.libs.json._

final case class BoostDto(
  target: String,
  index: Option[Int]
)

object BoostDto {
  implicit val format: OFormat[BoostDto] = Json.format[BoostDto]
}
