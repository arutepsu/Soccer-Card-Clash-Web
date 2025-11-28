package app.session

import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import app.domain.commands.GameCommand

trait IGameSessionService {
  def createSession(hostName: String): Either[GameSessionError, SessionCreated]

  def joinSession(id: GameSessionId, guestName: String): Either[GameSessionError, SessionJoined]

  def submitCommand(
    id: GameSessionId,
    token: PlayerToken,
    cmd: GameCommand
  ): Either[GameSessionError, GameContext]
}
