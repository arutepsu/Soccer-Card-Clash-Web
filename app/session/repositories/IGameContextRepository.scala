package app.session.repositories
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import app.session.GameSessionId

trait IGameContextRepository {
  def get(id: GameSessionId): Option[GameContext]
  def set(id: GameSessionId, ctx: GameContext): Unit
  def clear(id: GameSessionId): Unit
  def keys: Seq[GameSessionId]
}
