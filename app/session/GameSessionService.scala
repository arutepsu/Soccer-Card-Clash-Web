package app.session

import javax.inject._
import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters._

import app.api.IGameUseCases
import app.domain.commands.GameCommand
import app.session.SessionInfo
import app.models.AppError
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import app.session.repositories._
import GameSessionError._
import scala.util.Random

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

  override def createSession(hostName: String): Either[GameSessionError, SessionCreated] = {
    val id   = newSessionId()
    val host = newToken()

    val info = SessionInfo(
      hostName   = hostName,
      hostToken  = host,
      guestName  = None,
      guestToken = None
    )

    sessionRepo.set(id, info)
    Right(SessionCreated(id, host))
  }

  override def joinSession(id: GameSessionId, guestName: String): Either[GameSessionError, SessionJoined] =
    getSession(id) match {
      case None =>
        Left(NotFound(id))

      case Some(info) if info.guestToken.isDefined =>
        Left(SessionFull(id))

      case Some(info) =>
        val guestToken = newToken()

        val res = gameUseCases.createGame(info.hostName, guestName, id)

        res match {
          case Left(AppError(message)) =>
            Left(CommandFailed(message))

          case Right(_) =>
            ctxRepo.get(id) match {
              case None =>
                Left(CommandFailed("Game context missing after createGame"))
              case Some(ctx) =>
                val updated = info.copy(
                  guestName  = Some(guestName),
                  guestToken = Some(guestToken)
                )
                updateSession(id, updated)
                Right(SessionJoined(id, guestToken, ctx))
            }
        }
    }

  override def submitCommand(
    id: GameSessionId,
    token: PlayerToken,
    cmd: GameCommand
  ): Either[GameSessionError, GameContext] =
    getSession(id) match {
      case None =>
        Left(NotFound(id))

      case Some(info) =>
        if (!isAuthorized(info, token))
          Left(Unauthorized(id, token))
        else
          executeCommandThroughUseCases(id, cmd)
    }

  private def isAuthorized(info: SessionInfo, token: PlayerToken): Boolean =
    info.hostToken == token || info.guestToken.contains(token)

  // Bridge GameCommand -> IGameUseCases, then pull GameContext

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
