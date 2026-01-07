package app.api.ai

import javax.inject._
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import de.htwg.se.soccercardclash.model.playerComponent.base.{AI, Player}
import de.htwg.se.soccercardclash.util.{AIAction, NoOpAIAction}

@Singleton
final class DomainAiDecisionService @Inject()() extends IAiDecisionService {

  override def decide(ctx: GameContext): AIAction =
    ctx.state.getRoles.attacker match {
      case p: Player if p.isAI =>
        p.playerType match {
          case AI(strategy) => strategy.decideAction(ctx, p)
          case _            => NoOpAIAction
        }
      case _ =>
        NoOpAIAction
    }
}
