package app.api.protocol

import play.api.libs.json._

final case class Envelope(
  kind: String,
  `type`: String,
  gameId: String,
  playerId: Option[String] = None,
  requestId: Option[String] = None,
  version: Int = 1,
  payload: JsValue = JsObject.empty
)
// {
//   "kind": "command",
//   "type": "RegularAttack",
//   "gameId": "ignored",
//   "requestId": null,
//   "payload": { "target": "defender", "index": 2 }
// }


object Envelope {
  implicit val format: OFormat[Envelope] = Json.format[Envelope]
}

object MessageTypes {
  val CreateGame        = "CreateGame"
  val CreateGameWithAI  = "CreateGameWithAI"
  val LoadGame          = "LoadGame"
  val SaveGame          = "SaveGame"
  val QuitGame          = "QuitGame"

  val GetState          = "GetState"

  val RegularAttack     = "RegularAttack"
  val DoubleAttack      = "DoubleAttack"
  val Boost             = "Boost"
  val RegularSwap       = "RegularSwap"
  val ReverseSwap       = "ReverseSwap"
  val Undo              = "Undo"
  val Redo              = "Redo"
  val ExecuteAI         = "ExecuteAI"

  val StateUpdated      = "StateUpdated"
  val GameError         = "GameError"
}