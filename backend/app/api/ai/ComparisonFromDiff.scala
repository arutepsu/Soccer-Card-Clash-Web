package app.api.ai

import javax.inject._
import play.api.libs.json._

import app.api.command.GameCommand
import app.mapping.CardViewMapper
import de.htwg.se.soccercardclash.model.cardComponent.ICard
import de.htwg.se.soccercardclash.model.cardComponent.base.types.BoostedCard
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import de.htwg.se.soccercardclash.model.playerComponent.IPlayer

@Singleton
final class ComparisonFromDiff @Inject()(
  cardMapper: CardViewMapper
) {

  def metaFor(cmd: GameCommand, beforeOpt: Option[GameContext], after: GameContext): JsObject =
    cmd match {
      case GameCommand.SingleAttack(_) | GameCommand.DoubleAttack(_) =>
        buildAttackMeta(cmd, beforeOpt, after).getOrElse(Json.obj())
      case _ =>
        Json.obj()
    }

  private def buildAttackMeta(
    cmd: GameCommand,
    beforeOpt: Option[GameContext],
    after: GameContext
  ): Option[JsObject] = {

    val before = beforeOpt.getOrElse(return None)

    val bState = before.state
    val aState = after.state

    val bCards = bState.getGameCards
    val aCards = aState.getGameCards

    val bRoles = bState.getRoles
    val aRoles = aState.getRoles

    val attackerBeforeName = bRoles.attacker.name
    val defenderBeforeName = bRoles.defender.name

    def playerByName(ctx: GameContext, name: String): Option[IPlayer] = {
      val r = ctx.state.getRoles
      Seq(r.attacker, r.defender).find(_.name == name)
    }

    val attackerBeforeInAfter = playerByName(after, attackerBeforeName).getOrElse(return None)
    val defenderBeforeInAfter = playerByName(after, defenderBeforeName).getOrElse(return None)

    val bHand = bCards.getPlayerHand(bRoles.attacker).toList
    val aHand = aCards.getPlayerHand(attackerBeforeInAfter).toList

    val removedFromHand: Seq[ICard] =
      multisetRemoved(bHand, aHand)

    val expectedAttackCount = cmd match {
      case GameCommand.DoubleAttack(_) => 2
      case _                           => 1
    }

    val attackCards = removedFromHand.take(expectedAttackCount)
    if (attackCards.size != expectedAttackCount) return None

    val bDefs = bCards.getPlayerDefenders(bRoles.defender).flatten
    val aDefs = aCards.getPlayerDefenders(defenderBeforeInAfter).flatten

    val removedDefenders: Seq[ICard] =
      multisetRemoved(bDefs, aDefs)

    val defendCard: Option[ICard] = removedDefenders.headOption
    if (defendCard.isEmpty) return None

    val rolesSwitched = aRoles.attacker.name != bRoles.attacker.name

    val rolesSwitched = aRoles.attacker.name != bRoles.attacker.name
    val success = !rolesSwitched

    val kind = cmd match {
      case GameCommand.DoubleAttack(_) => "Double"
      case _                           => "Regular"
    }

    def cv(c: ICard): JsValue =
      Json.toJson(cardMapper.toCardView(c))

    val variant =
    cmd match {
        case GameCommand.DoubleAttack(_) => "double"
        case _                           => "single"
    }

    def cvOpt(c: Option[ICard]): JsValue =
    c.map(c => Json.toJson(cardMapper.toCardView(c))).getOrElse(JsNull)

    val atk1 = attackCards.headOption
    val atk2 = attackCards.lift(1)

    Some(
        Json.obj(
            "action" -> "Comparison",
            "payload" -> Json.obj(
            "variant" -> variant,
            "attacker" -> Json.obj("name" -> attackerBeforeName),
            "defender" -> Json.obj("name" -> defenderBeforeName),

            "attackingCard"  -> cvOpt(atk1),
            "attackingCard2" -> cvOpt(atk2),
            "defendingCard"  -> cvOpt(defendCard),

            "extraAttackerCard" -> JsNull,
            "extraDefenderCard" -> JsNull,

            "attackSuccess" -> success
            )
        )
    )

  }

  private def cardKey(c: ICard): String = c match {
    case b: BoostedCard =>
      s"${c.suit}:${c.value}:B:${b.additionalValue}"
    case _ =>
      s"${c.suit}:${c.value}:R"
  }

  private def multisetRemoved(before: Seq[ICard], after: Seq[ICard]): Seq[ICard] = {
    val afterCounts = scala.collection.mutable.Map.empty[String, Int].withDefaultValue(0)
    after.foreach(c => afterCounts(cardKey(c)) += 1)

    val removed = scala.collection.mutable.ListBuffer.empty[ICard]
    before.foreach { c =>
      val k = cardKey(c)
      val n = afterCounts(k)
      if (n > 0) afterCounts(k) = n - 1
      else removed += c
    }

    removed.toSeq
  }
}
