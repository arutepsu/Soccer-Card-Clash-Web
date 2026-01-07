package app.api.ai

import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import de.htwg.se.soccercardclash.util.AIAction

trait IAiDecisionService {
  def decide(ctx: GameContext): AIAction
}
