package app.session

sealed trait GameSessionError

object GameSessionError {
  final case class NotFound(id: GameSessionId) extends GameSessionError
  final case class Unauthorized(id: GameSessionId, userId: String) extends GameSessionError
  final case class SessionFull(id: GameSessionId) extends GameSessionError
  final case class AlreadyJoined(id: GameSessionId) extends GameSessionError
  final case class CommandFailed(message: String) extends GameSessionError
}