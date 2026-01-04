package app.api.eventHub

import java.util.concurrent.atomic.AtomicLong
import scala.collection.concurrent.TrieMap
import scala.collection.immutable.Vector
import scala.concurrent.ExecutionContext

import play.api.libs.json.{JsObject, Json}

import app.session.GameSessionId
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext

final case class GameEvent(
  eventId: Long,
  ctx: GameContext,
  meta: JsObject = Json.obj()
)

@javax.inject.Singleton
class GameEventHub @javax.inject.Inject()()(implicit ec: ExecutionContext) {

  private val nextId = new AtomicLong(1L)

  private val historyBySid =
    TrieMap.empty[String, Vector[GameEvent]]

  private val listenersBySid =
    TrieMap.empty[String, List[GameEvent => Unit]]

  def publish(sid: GameSessionId, ctx: GameContext, meta: JsObject = Json.obj()): GameEvent = {
    val id  = nextId.getAndIncrement()
    val ev  = GameEvent(id, ctx, meta)
    val key = sid.value

    historyBySid.updateWith(key) {
      case Some(vec) => Some((vec :+ ev).takeRight(500))
      case None      => Some(Vector(ev))
    }

    listenersBySid.get(key).foreach { list =>
      list.foreach { cb =>
        ec.execute(() => {
          try cb(ev)
          catch { case _: Throwable => () }
        })
      }
    }

    ev
  }


  def subscribe(sid: GameSessionId)(cb: GameEvent => Unit): () => Unit = {
    val key = sid.value
    listenersBySid.updateWith(key) {
      case Some(list) => Some(cb :: list)
      case None       => Some(cb :: Nil)
    }

    () => {
      listenersBySid.updateWith(key) {
        case Some(list) =>
          val updated = list.filterNot(_ eq cb)
          if (updated.isEmpty) None else Some(updated)
        case None => None
      }
    }
  }

  def getSince(sid: GameSessionId, lastEventId: Long): Seq[GameEvent] =
    historyBySid.getOrElse(sid.value, Vector.empty).filter(_.eventId > lastEventId)
}
