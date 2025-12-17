package app.session.repositories

import app.session.GameSessionId
import app.session.SessionInfo

trait IGameSessionRepository {
  def get(id: GameSessionId): Option[SessionInfo]
  def set(id: GameSessionId, info: SessionInfo): Unit
  def clear(id: GameSessionId): Unit
  def keys: Seq[GameSessionId]
  def all(): Seq[(GameSessionId, SessionInfo)]
}
