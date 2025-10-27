package app.mapping

import app.models._
import de.htwg.se.soccercardclash.model.gameComponent.components.*
import de.htwg.se.soccercardclash.model.gameComponent.IGameState
import app.api.*
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import de.htwg.se.soccercardclash.model.playerComponent.IPlayer
import de.htwg.se.soccercardclash.model.cardComponent.dataStructure.IHandCardsQueue
import de.htwg.se.soccercardclash.model.cardComponent.ICard
import de.htwg.se.soccercardclash.model.playerComponent.playerAction.CanPerformAction
import de.htwg.se.soccercardclash.model.gameComponent.IGameState
import de.htwg.se.soccercardclash.model.playerComponent.playerAction.PlayerActionPolicies
import de.htwg.se.soccercardclash.model.cardComponent.base.types.BoostedCard
import scala.reflect.Selectable.reflectiveSelectable

object ViewStateMapper {

  def toWebState(ctx: GameContext): WebGameState = {
    val s         = ctx.state
    val roles     = s.getRoles
    val gameCards = s.getGameCards
    val scores    = s.getScores

    val att = roles.attacker
    val de  = roles.defender

    val attackerHand = qToSeq(gameCards.getPlayerHand(att)).map(toCardView)
    val defenderHand = qToSeq(gameCards.getPlayerHand(de)).map(toCardView)

    val attackerField = toSlots(gameCards.getPlayerDefenders(att), "att-slot")
    val defenderField = toSlots(gameCards.getPlayerDefenders(de), "def-slot")

    val attackerGK = gameCards.getPlayerGoalkeeper(att).map(toCardView)
    val defenderGK = gameCards.getPlayerGoalkeeper(de).map(toCardView)

    val allowed = ActionLimitsMapper.toAllowed(att, de)

    WebGameState(
      roles = RolesView(attacker = att.name, defender = de.name),
      scores = ScoresView(
        attacker = scores.getScore(att),
        defender = scores.getScore(de)
      ),
      cards = CardsView(
        attackerHand = attackerHand,
        defenderHand = defenderHand,
        attackerField = attackerField,
        defenderField = defenderField,
        attackerGoalkeeper = attackerGK,
        defenderGoalkeeper = defenderGK
      ),
      allowed = allowed
    )
  }

  private def qToSeq(q: IHandCardsQueue): Seq[ICard] = {
    import scala.reflect.Selectable.reflectiveSelectable

    q match {
      case s: scala.collection.Seq[?] =>
        s.asInstanceOf[scala.collection.Seq[ICard]].toSeq
      case it: scala.collection.Iterable[?] =>
        it.asInstanceOf[scala.collection.Iterable[ICard]].toSeq
      case _ =>
        try {
          q.asInstanceOf[{ def getCards: scala.collection.Iterable[ICard] }].getCards.toSeq
        } catch {
          case _: Throwable => Seq.empty
        }
    }
  }


  private def toSlots(defenders: List[Option[ICard]], prefix: String): Seq[CardSlotView] =
    defenders.zipWithIndex.map { case (c, i) =>
      CardSlotView(id = s"$prefix-$i", card = c.map(toCardView))
    }

  private def toCardView(c: ICard): CardView =
    CardView(
      id      = stableId(c),
      rank    = c.value.toString,
      suit    = c.suit.toString,
      value   = c.valueToInt,
      boosted = false
    )

  private def stableId(c: ICard): String =
    s"${c.suit}-${c.value}-${System.identityHashCode(c)}"
}
