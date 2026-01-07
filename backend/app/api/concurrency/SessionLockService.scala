package app.api.concurrency

import javax.inject._
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.locks.ReentrantLock
import app.session.GameSessionId

@Singleton
final class SessionLockService @Inject()() {

  private val locks = new ConcurrentHashMap[String, ReentrantLock]()

  def withLock[A](sid: GameSessionId)(f: => A): A = {
    val lock = locks.computeIfAbsent(sid.value, _ => new ReentrantLock())
    lock.lock()
    try f
    finally lock.unlock()
  }
}
