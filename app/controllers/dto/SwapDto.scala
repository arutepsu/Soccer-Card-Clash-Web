package controllers.dto

import play.api.libs.json._

final case class SwapDto(
  index: Int
)

object SwapDto {
  implicit val format: OFormat[SwapDto] = Json.format[SwapDto]
}
