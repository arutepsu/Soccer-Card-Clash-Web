package app.api.ai

import javax.inject._
import de.htwg.se.soccercardclash.controller.IController
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import de.htwg.se.soccercardclash.model.playerComponent.base.Player
import de.htwg.se.soccercardclash.util.{AIAction, NoOpAIAction}

@Singleton
final class AiTurnService @Inject()(
  controller: IController,
  aiDecision: IAiDecisionService
) {
  private val MaxAiSteps = 50

  def runIfNeeded(ctx0: GameContext): GameContext = {
    var ctx = ctx0
    var steps = 0

    while (steps < MaxAiSteps && isAiAttacker(ctx)) {
      val action: AIAction = aiDecision.decide(ctx)
      if (action == NoOpAIAction) return ctx

      val (next, ok) = controller.executeAIAction(action, ctx)
      if (!ok) return ctx

      ctx = next
      steps += 1
    }

    ctx
  }

  private def isAiAttacker(ctx: GameContext): Boolean =
    ctx.state.getRoles.attacker match {
      case p: Player if p.isAI => true
      case _                   => false
    }
}