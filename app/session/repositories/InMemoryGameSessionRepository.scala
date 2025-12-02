package app.session.repositories

import javax.inject._
import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters._
import app.session.SessionInfo
import app.session.GameSessionId

@Singleton
final class InMemoryGameSessionRepository @Inject()() extends IGameSessionRepository {

  private val store = new ConcurrentHashMap[String, SessionInfo]()

  override def get(id: GameSessionId): Option[SessionInfo] =
    Option(store.get(id.value))

  override def set(id: GameSessionId, info: SessionInfo): Unit =
    store.put(id.value, info)

  override def clear(id: GameSessionId): Unit =
    store.remove(id.value)

  override def keys: Seq[GameSessionId] =
    store.keySet().asScala.toSeq.sorted.map(GameSessionId.apply)
}
