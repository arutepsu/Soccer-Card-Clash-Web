package controller.json

import play.api.libs.json._
import de.htwg.se.soccercardclash.util._

/** Play JSON (de)serializers for AIAction and Zone hierarchy.
  * Lives in the web layer since it's only needed for API serialization.
  */
object AIActionJson {

  // ---------- Zone ----------
  implicit val zoneReads: Reads[Zone] = Reads {
    case JsString("DefenderZone")   => JsSuccess(DefenderZone)
    case JsString("GoalkeeperZone") => JsSuccess(GoalkeeperZone)
    case other                      => JsError(s"Unknown zone: $other")
  }

  implicit val zoneWrites: Writes[Zone] = Writes {
    case DefenderZone   => JsString("DefenderZone")
    case GoalkeeperZone => JsString("GoalkeeperZone")
  }

  implicit val zoneFormat: Format[Zone] = Format(zoneReads, zoneWrites)

  // ---------- AIAction ----------
  implicit val aiActionReads: Reads[AIAction] = Reads { json =>
    (json \ "type").asOpt[String] match {
      case Some("SingleAttackAIAction") =>
        (json \ "defenderIndex").validate[Int].map(SingleAttackAIAction)
      case Some("DoubleAttackAIAction") =>
        (json \ "defenderIndex").validate[Int].map(DoubleAttackAIAction)
      case Some("RegularSwapAIAction") =>
        (json \ "index").validate[Int].map(RegularSwapAIAction)
      case Some("ReverseSwapAIAction") => JsSuccess(ReverseSwapAIAction)
      case Some("UndoAIAction")        => JsSuccess(UndoAIAction)
      case Some("RedoAIAction")        => JsSuccess(RedoAIAction)
      case Some("NoOpAIAction")        => JsSuccess(NoOpAIAction)
      case Some("BoostAIAction") =>
        for {
          idx  <- (json \ "cardIndex").validate[Int]
          zone <- (json \ "zone").validate[Zone]
        } yield BoostAIAction(idx, zone)
      case other =>
        JsError(s"Unknown AIAction type: $other")
    }
  }

  implicit val aiActionWrites: Writes[AIAction] = Writes {
    case SingleAttackAIAction(i) =>
      Json.obj("type" -> "SingleAttackAIAction", "defenderIndex" -> i)
    case DoubleAttackAIAction(i) =>
      Json.obj("type" -> "DoubleAttackAIAction", "defenderIndex" -> i)
    case RegularSwapAIAction(i) =>
      Json.obj("type" -> "RegularSwapAIAction", "index" -> i)
    case ReverseSwapAIAction =>
      Json.obj("type" -> "ReverseSwapAIAction")
    case UndoAIAction =>
      Json.obj("type" -> "UndoAIAction")
    case RedoAIAction =>
      Json.obj("type" -> "RedoAIAction")
    case NoOpAIAction =>
      Json.obj("type" -> "NoOpAIAction")
    case BoostAIAction(idx, zone) =>
      Json.obj("type" -> "BoostAIAction", "cardIndex" -> idx, "zone" -> Json.toJson(zone))
  }

  implicit val aiActionFormat: Format[AIAction] = Format(aiActionReads, aiActionWrites)
}
