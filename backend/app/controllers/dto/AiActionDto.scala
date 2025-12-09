package controllers.dto

import play.api.libs.json._

final case class AIActionDto(
  actionType: String,
  target: Option[String],
  index: Option[Int]
)

object AIActionDto {
  implicit val format: OFormat[AIActionDto] = Json.format[AIActionDto]
}
