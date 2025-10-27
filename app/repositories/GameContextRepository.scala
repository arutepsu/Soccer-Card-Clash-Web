package app.repositories
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext

trait GameContextRepository {
  def get(sessionId: String): Option[GameContext]
  def set(sessionId: String, ctx: GameContext): Unit
  def clear(sessionId: String): Unit
}
