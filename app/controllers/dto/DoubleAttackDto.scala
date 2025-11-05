package controllers.dto

import play.api.libs.json._

final case class DoubleAttackDto(
  index: Int
)

object DoubleAttackDto {
  implicit val format: OFormat[DoubleAttackDto] = Json.format[DoubleAttackDto]
}
