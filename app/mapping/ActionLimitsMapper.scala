package app.mapping

import app.models.{ActionLimitsView, AllowedActionsView}
import de.htwg.se.soccercardclash.model.playerComponent.IPlayer
import de.htwg.se.soccercardclash.model.playerComponent.playerAction.{
  PlayerActionPolicies, CanPerformAction
}

object ActionLimitsMapper {

  def toAllowed(attacker: IPlayer, defender: IPlayer): AllowedActionsView = {
    AllowedActionsView(
      attacker = limitsFor(attacker),
      defender = limitsFor(defender)
    )
  }

  private def limitsFor(p: IPlayer): ActionLimitsView = {
    val m = p.getActionStates

    def remaining(policy: PlayerActionPolicies): Int =
      m.get(policy) match {
        case Some(CanPerformAction(n)) => n
        case _                         => 0
      }

    ActionLimitsView(
      swapRemaining         = remaining(PlayerActionPolicies.Swap),
      boostRemaining        = remaining(PlayerActionPolicies.Boost),
      doubleAttackRemaining = remaining(PlayerActionPolicies.DoubleAttack)
    )
  }
}
