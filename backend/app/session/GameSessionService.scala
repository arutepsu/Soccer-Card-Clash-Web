package app.session

import javax.inject._
import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters._

import app.api.usecases.IGameUseCases
import app.api.command.GameCommand
import app.session.SessionInfo
import app.models.AppError
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import app.session.repositories._
import app.api.context._
import GameSessionError._
import scala.util.Random
import app.auth.AuthPrincipal

@Singleton
final class GameSessionService @Inject()(
  gameUseCases: IGameUseCases,
  ctxRepo: IGameContextRepository,
  sessionRepo: IGameSessionRepository
) extends IGameSessionService {

  private def newSessionId(): GameSessionId =
    GameSessionId(java.util.UUID.randomUUID().toString)

  private def newToken(): PlayerToken =
    PlayerToken(java.util.UUID.randomUUID().toString)

  private def getSession(id: GameSessionId): Option[SessionInfo] =
    sessionRepo.get(id)

  private def updateSession(id: GameSessionId, info: SessionInfo): Unit =
    sessionRepo.set(id, info)

  override def createSession(principal: AuthPrincipal, hostName: String): Either[GameSessionError, SessionCreated] = {
    val id   = newSessionId()
    val host = newToken()

    val info = SessionInfo(
      hostName    = hostName,
      hostToken   = host,
      hostUserId  = principal.userId,
      guestName   = None,
      guestToken  = None,
      guestUserId = None
    )

    sessionRepo.set(id, info)
    Right(SessionCreated(id, host))
  }

  override def joinSession(
    principal: AuthPrincipal,
    id: GameSessionId,
    guestName: String
  ): Either[GameSessionError, SessionJoined] =
    getSession(id) match {
      case None =>
        Left(NotFound(id))

      case Some(info) if info.guestToken.isDefined =>
        Left(SessionFull(id))

      case Some(info) =>
        val guestToken = newToken()

        gameUseCases.createGame(info.hostName, guestName, id) match {
          case Left(AppError(message)) =>
            Left(CommandFailed(message))

          case Right(_) =>
            ctxRepo.get(id) match {
              case None =>
                Left(CommandFailed("Game context missing after createGame"))

              case Some(ctx) =>
                val updated = info.copy(
                  guestName   = Some(guestName),
                  guestToken  = Some(guestToken),
                  guestUserId = Some(principal.userId)
                )
                updateSession(id, updated)
                Right(SessionJoined(id, guestToken, ctx))
            }
        }
    }

  override def submitCommand(
    id: GameSessionId,
    principal: AuthPrincipal,
    cmd: GameCommand
  ): Either[GameSessionError, GameContext] =
    getSession(id) match {
      case None => Left(NotFound(id))
      case Some(info) =>
        if (!isAuthorized(info, principal)) Left(Unauthorized(id, principal.userId))
        else executeCommandThroughUseCases(id, cmd)
    }

  private def isAuthorized(info: SessionInfo, p: AuthPrincipal): Boolean =
    info.hostUserId == p.userId || info.guestUserId.contains(p.userId)

  override def createSession(hostName: String): Either[GameSessionError, SessionCreated] =
    createSession(AuthPrincipal(userId = hostName, username = hostName), hostName)

  override def joinSession(id: GameSessionId, guestName: String): Either[GameSessionError, SessionJoined] =
    joinSession(AuthPrincipal(userId = guestName, username = guestName), id, guestName)

  override def submitCommand(
    id: GameSessionId,
    token: PlayerToken,
    cmd: GameCommand
  ): Either[GameSessionError, GameContext] =
    getSession(id) match {
      case None => Left(NotFound(id))
      case Some(info) =>
        if (!isAuthorized(info, token)) Left(Unauthorized(id, token.value))
        else executeCommandThroughUseCases(id, cmd)
    }

  private def isAuthorized(info: SessionInfo, token: PlayerToken): Boolean =
    info.hostToken == token || info.guestToken.contains(token)

  private def executeCommandThroughUseCases(
    id: GameSessionId,
    cmd: GameCommand
  ): Either[GameSessionError, GameContext] = {

    val result: Either[AppError, _] = cmd match {
      case GameCommand.SingleAttack(index) =>
        gameUseCases.singleAttack(index, id)
      case GameCommand.DoubleAttack(index) =>
        gameUseCases.doubleAttack(index, id)
      case GameCommand.Boost(index, goalkeeper) =>
        gameUseCases.boost(index, id, goalkeeper)
      case GameCommand.RegularSwap(index) =>
        gameUseCases.swap(index, id)
      case GameCommand.ReverseSwap =>
        gameUseCases.reverseSwap(id)
      case GameCommand.Undo =>
        gameUseCases.undo(id)
      case GameCommand.Redo =>
        gameUseCases.redo(id)
      case GameCommand.ExecuteAI(action) =>
        gameUseCases.executeAI(action, id)
      case GameCommand.CreateGame(p1, p2) =>
        gameUseCases.createGame(p1, p2, id)
      case GameCommand.CreateGameWithAI(human, aiName) =>
        gameUseCases.createGameWithAI(human, aiName, id)
      case GameCommand.LoadGame(fileName) =>
        gameUseCases.load(fileName, id)
      case GameCommand.SaveGame =>
        gameUseCases.save(id)
      case GameCommand.QuitGame =>
        gameUseCases.quit()
      case GameCommand.GetState =>
        gameUseCases.state(id)
    }

    result match {
      case Left(AppError(message)) =>
        Left(CommandFailed(message))

      case Right(_) =>
        ctxRepo.get(id) match {
          case None =>
            Left(CommandFailed("Game context missing after command execution"))
          case Some(ctx) =>
            Right(ctx)
        }
    }
  }
}
