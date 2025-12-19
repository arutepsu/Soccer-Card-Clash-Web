package app.mapping

import javax.inject._
import app.models.view._
import app.models.state.WebGameState
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
import app.auth.AuthPrincipal
import app.session.SessionInfo

trait IViewStateMapper {
  def toWebState(
    ctx: GameContext,
    principal: Option[AuthPrincipal],
    infoOpt: Option[SessionInfo]
  ): WebGameState
}

@Singleton
class ViewStateMapper @Inject()() extends IViewStateMapper {

  override def toWebState(
    ctx: GameContext,
    principal: Option[AuthPrincipal],
    infoOpt: Option[SessionInfo]
  ): WebGameState = {

    val s         = ctx.state
    val roles     = s.getRoles
    val gameCards = s.getGameCards
    val scores    = s.getScores

    val att = roles.attacker
    val de  = roles.defender

    def handFor(p: IPlayer): Seq[CardView] =
      qToSeq(gameCards.getPlayerHand(p)).map(toCardView)

    def fieldSlotsFor(p: IPlayer, prefix: String): Seq[CardSlotView] = {
      val defenders: List[Option[ICard]] = gameCards.getPlayerDefenders(p)
      defenders.zipWithIndex.map { case (maybeCard, i) =>
        CardSlotView(id = s"$prefix-$i", card = maybeCard.map(toCardView))
      }
    }

    val attackerGK = gameCards.getPlayerGoalkeeper(att).map(toCardView)
    val defenderGK = gameCards.getPlayerGoalkeeper(de).map(toCardView)

    val allowed = ActionLimitsMapper.toAllowed(att, de)

    val youView: Option[YouView] =
          for {
            p    <- principal
            info <- infoOpt

            youIsHost <- {
              if (info.hostUserId == p.userId) Some(true)
              else if (info.guestUserId.contains(p.userId)) Some(false)
              else None
            }
          } yield {
            val hostIsAttackerNow = ctx.state.getRoles.attacker.name == info.hostName

            val youIsAttackerNow =
              (youIsHost && hostIsAttackerNow) ||
              (!youIsHost && !hostIsAttackerNow)

            val sideEnum =
              if (youIsAttackerNow) PlayerSide.attacker else PlayerSide.defender

            YouView(
              userId     = p.userId,
              username   = p.username,
              side       = sideEnum,
              isAttacker = youIsAttackerNow
            )
          }

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
            defenderField      = fieldSlotsFor(de, "def"),
            attackerGoalkeeper = attackerGK,
            defenderGoalkeeper = defenderGK
          ),
          allowed = allowed,
          you = youView
        )
    }


  private def qToSeq(q: IHandCardsQueue): Seq[ICard] =
    q.toList

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