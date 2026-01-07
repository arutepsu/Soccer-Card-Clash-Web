// app/api/eventHub/GameMetaMapper.scala
package app.api.eventHub

import play.api.libs.json._
import de.htwg.se.soccercardclash.util._
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext

object GameMetaMapper {

  def fromDomainEvent(e: ObservableEvent, before: GameContext, after: GameContext): JsObject =
    e match {
      case GameActionEvent.RegularAttack =>
        Json.obj("action" -> "Comparison", "payload" -> comparisonPayload(attackType = "RegularAttack", before, after))

      case GameActionEvent.DoubleAttack =>
        Json.obj("action" -> "Comparison", "payload" -> comparisonPayload(attackType = "DoubleAttack", before, after))

      case StateEvent.ScoreEvent(player) =>
        Json.obj("action" -> "Goal", "payload" -> Json.obj("player" -> player.name))

      case StateEvent.GameOver(winner) =>
        Json.obj("action" -> "GameOver", "payload" -> Json.obj("winner" -> winner.name))

      case GameActionEvent.BoostDefender =>
        Json.obj("action" -> "Boost", "payload" -> Json.obj("target" -> "Defender"))

      case GameActionEvent.BoostGoalkeeper =>
        Json.obj("action" -> "Boost", "payload" -> Json.obj("target" -> "Goalkeeper"))

      case GameActionEvent.RegularSwap =>
        Json.obj("action" -> "Swap", "payload" -> Json.obj("type" -> "Regular"))

      case GameActionEvent.ReverseSwap =>
        Json.obj("action" -> "Swap", "payload" -> Json.obj("type" -> "Reverse"))

      case _ =>
        Json.obj()
    }

  private def comparisonPayload(attackType: String, before: GameContext, after: GameContext): JsObject = {
    // IMPORTANT: you need actual compared cards.
    // The *best* solution is: include compared cards in a domain event.
    // If you can't: add "lastComparison" tracking in the domain state/context.
    // For now, return minimal payload that still lets UI queue/overlay timing work:
    Json.obj(
      "attackType" -> attackType,
      "attacker" -> before.state.getRoles.attacker.name,
      "defender" -> before.state.getRoles.defender.name
      // TODO: add cards + values once available
    )
  }
}
