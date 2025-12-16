package app.session

import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import app.api.command.GameCommand
import app.auth.AuthPrincipal

trait IGameSessionService {

  def createSession(principal: AuthPrincipal, hostName: String): Either[GameSessionError, SessionCreated]

  def joinSession(principal: AuthPrincipal, id: GameSessionId, guestName: String): Either[GameSessionError, SessionJoined]

  def submitCommand(
    id: GameSessionId,
    principal: AuthPrincipal,
    cmd: GameCommand
  ): Either[GameSessionError, GameContext]

  def createSession(hostName: String): Either[GameSessionError, SessionCreated]

  def joinSession(id: GameSessionId, guestName: String): Either[GameSessionError, SessionJoined]

  def submitCommand(
    id: GameSessionId,
    token: PlayerToken,
    cmd: GameCommand
  ): Either[GameSessionError, GameContext]
}
