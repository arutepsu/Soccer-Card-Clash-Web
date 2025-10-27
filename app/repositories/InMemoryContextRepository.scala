package app.repositories
import javax.inject._
import java.util.concurrent.ConcurrentHashMap
import app.repositories.GameContextRepository
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext

@Singleton
final class InMemoryGameContextRepository @Inject()() extends GameContextRepository {
  private val store = new ConcurrentHashMap[String, GameContext]()
  def get(sid: String) = Option(store.get(sid))
  def set(sid: String, ctx: GameContext) = store.put(sid, ctx)
  def clear(sid: String) = store.remove(sid)
}
