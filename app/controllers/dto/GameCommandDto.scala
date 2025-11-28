package app.controllers.dto

import play.api.libs.json._

sealed trait GameCommandDto

object GameCommandDto {

  case class SingleAttack(defenderIndex: Int) extends GameCommandDto
  case class DoubleAttack(defenderIndex: Int) extends GameCommandDto
  case class Boost(defenderIndex: Int, goalkeeper: Boolean) extends GameCommandDto
  case class Swap(defenderIndex: Int) extends GameCommandDto
  case class ReverseSwap() extends GameCommandDto
  case class Undo() extends GameCommandDto
  case class Redo() extends GameCommandDto
  case object DoAI extends GameCommandDto

  implicit val reads: Reads[GameCommandDto] = Reads { js =>
    (js \ "type").as[String].toUpperCase match {

      case "ATTACK" | "SINGLE_ATTACK" =>
        JsSuccess(SingleAttack((js \ "defenderIndex").as[Int]))

      case "DOUBLE_ATTACK" =>
        JsSuccess(DoubleAttack((js \ "defenderIndex").as[Int]))

      case "BOOST" =>
        JsSuccess(Boost(
          defenderIndex = (js \ "defenderIndex").as[Int],
          goalkeeper    = (js \ "goalkeeper").asOpt[Boolean].getOrElse(false)
        ))

      case "SWAP" =>
        JsSuccess(Swap((js \ "defenderIndex").as[Int]))

      case "REVERSE_SWAP" =>
        JsSuccess(ReverseSwap())

      case "UNDO"  => JsSuccess(Undo())
      case "REDO"  => JsSuccess(Redo())
      case "AI"    => JsSuccess(DoAI)

      case other =>
        JsError(s"Unknown command type: $other")
    }
  }
}
