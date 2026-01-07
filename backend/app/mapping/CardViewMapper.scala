package app.mapping

import javax.inject._
import app.models.view.CardView
import de.htwg.se.soccercardclash.model.cardComponent.ICard
import de.htwg.se.soccercardclash.model.cardComponent.base.types.BoostedCard

@Singleton
final class CardViewMapper @Inject()() {
  def toCardView(c: ICard): CardView = {
    val isBoosted = c match {
      case _: BoostedCard => true
      case _              => false
    }
    val rankStr = c.value.toString
    val suitStr = c.suit.toString
    CardView(
      id       = s"${c.suit}-${c.value}-${System.identityHashCode(c)}",
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
}
