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
import de.htwg.se.soccercardclash.model.cardComponent.ICard
import de.htwg.se.soccercardclash.model.cardComponent.base.types.BoostedCard

object ViewStateMapper {

  def toWebState(ctx: GameContext): WebGameState = {
    val s         = ctx.state
    val roles     = s.getRoles
    val gameCards = s.getGameCards
    val scores    = s.getScores

    val att = roles.attacker
    val de  = roles.defender

    // ---- HANDS (CardView)
// ---- HANDS (CardView)
    def handFor(p: IPlayer): Seq[CardView] =
      qToSeq(gameCards.getPlayerHand(p)).map(toCardView)

    // ---- FIELDS (CardSlotView)
    def fieldSlotsFor(p: IPlayer, prefix: String): Seq[CardSlotView] = {
      // Already a List[Option[ICard]], no need for pattern matching
      val defenders: List[Option[ICard]] = gameCards.getPlayerDefenders(p)
      defenders.zipWithIndex.map { case (maybeCard, i) =>
        CardSlotView(id = s"$prefix-$i", card = maybeCard.map(toCardView))
      }
    }
 

    val attackerGK = gameCards.getPlayerGoalkeeper(att).map(toCardView) // Option[CardView]
    val defenderGK = gameCards.getPlayerGoalkeeper(de).map(toCardView)  // Option[CardView]

    val allowed = ActionLimitsMapper.toAllowed(att, de)

    WebGameState(
      roles = RolesView(attacker = att.name, defender = de.name),
      scores = ScoresView(
        attacker = scores.getScore(att),
        defender = scores.getScore(de)
      ),
      cards = CardsView(
        attackerHand       = handFor(att),
        defenderHand       = handFor(de),
        attackerField      = fieldSlotsFor(att, "att"),
        defenderField      = fieldSlotsFor(de,  "def"),
        attackerGoalkeeper = attackerGK,
        defenderGoalkeeper = defenderGK
      ),
      allowed = allowed
    )
  }

  private def qToSeq(q: IHandCardsQueue): Seq[ICard] =
    q.toList // or q.cards



  private def toCardView(c: ICard): CardView = {
    val isBoosted = c match {
      case _: BoostedCard => true
      case _              => false
    }
    val rankStr = c.value.toString
    val suitStr = c.suit.toString
    CardView(
      id       = stableId(c),
      rank     = rankStr,
      suit     = suitStr,
      value    = c.valueToInt,
      boosted  = isBoosted,
      fileName = toFileName(rankStr, suitStr)
    )
  }


  private def toFileName(rank: String, suit: String): String = {
    def r(s: String) = s.toLowerCase match {
      case "jack" | "j"  => "jack"
      case "queen"| "q"  => "queen"
      case "king" | "k"  => "king"
      case "ace"  | "a"  => "ace"
      case other         => other
    }
    def sName(s: String) = s.toLowerCase match {
      case "club" | "clubs"       => "clubs"
      case "diamond" | "diamonds" => "diamonds"
      case "heart" | "hearts"     => "hearts"
      case "spade" | "spades"     => "spades"
      case other                  => other
    }
    s"${r(rank)}_of_${sName(suit)}"
  }

  private def stableId(c: ICard): String =
    s"${c.suit}-${c.value}-${System.identityHashCode(c)}"
}
