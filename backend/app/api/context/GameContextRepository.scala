package app.api.context

import javax.inject._
import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters.*
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import java.util.concurrent.ConcurrentHashMap
import app.session.GameSessionId

@Singleton
final class GameContextRepository @Inject()() extends IGameContextRepository {
  private val store = new ConcurrentHashMap[String, GameContext]()

  def get(id: GameSessionId): Option[GameContext] =
    Option(store.get(id.value))

  def set(id: GameSessionId, ctx: GameContext): Unit =
    store.put(id.value, ctx)

  def clear(id: GameSessionId): Unit =
    store.remove(id.value)

  def keys: Seq[GameSessionId] =
    store.keySet().asScala.toSeq.sorted.map(GameSessionId.apply)
}