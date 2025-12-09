package controllers.dto

import play.api.libs.json._

final case class LocalMultiplayerDto(
  attackerName: String,
  defenderName: String
)
object LocalMultiplayerDto {
  implicit val reads: Reads[LocalMultiplayerDto] = Json.reads[LocalMultiplayerDto]
}
