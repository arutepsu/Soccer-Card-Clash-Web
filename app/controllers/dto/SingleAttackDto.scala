package controllers.dto

import play.api.libs.json._

final case class SingleAttackDto(
  target: String,
  index: Option[Int]
)

object SingleAttackDto {
  implicit val format: OFormat[SingleAttackDto] = Json.format[SingleAttackDto]
}
