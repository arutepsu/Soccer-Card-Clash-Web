package app.session

import app.api.command.GameCommand
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import app.auth.AuthPrincipal

trait IGameSessionService {

  def listSessions(): Seq[(GameSessionId, SessionInfo)]

  def getSession(id: GameSessionId): Either[GameSessionError, SessionInfo]

  def createSession(
    principal: AuthPrincipal,
    hostName: String,
    sessionName: String
  ): Either[GameSessionError, SessionCreated]

  def startSession(
    principal: AuthPrincipal,
    token: PlayerToken,
    id: GameSessionId
  ): Either[GameSessionError, GameContext]

  def joinSession(
    principal: AuthPrincipal,
    id: GameSessionId,
    guestName: String
  ): Either[GameSessionError, SessionJoined]

  def submitCommand(
    id: GameSessionId,
    principal: AuthPrincipal,
    token: PlayerToken,
    cmd: GameCommand
  ): Either[GameSessionError, GameContext]

  def leaveSessionDisconnected(
    principal: AuthPrincipal,
    token: PlayerToken,
    id: GameSessionId
  ): Either[GameSessionError, SessionInfo]

  def leaveSession(
    principal: AuthPrincipal,
    token: PlayerToken,
    id: GameSessionId
  ): Either[GameSessionError, SessionInfo]
}
