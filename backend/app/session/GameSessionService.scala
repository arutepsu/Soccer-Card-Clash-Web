package app.session

import javax.inject._
import app.api.usecases.IGameUseCases
import app.api.command.GameCommand
import app.models.AppError
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import app.session.repositories._
import app.api.context._
import GameSessionError._
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

  private def getSessionOpt(id: GameSessionId): Option[SessionInfo] =
    sessionRepo.get(id)

  private def updateSession(id: GameSessionId, info: SessionInfo): Unit =
    sessionRepo.set(id, info)

  override def listSessions(): Seq[(GameSessionId, SessionInfo)] =
    sessionRepo.all()

  override def createSession(
    principal: AuthPrincipal,
    hostName: String,
    sessionName: String
  ): Either[GameSessionError, SessionCreated] = {

    val hn = hostName.trim
    val sn = sessionName.trim
    if (hn.isEmpty) return Left(CommandFailed("hostName must be non-empty"))
    if (sn.isEmpty) return Left(CommandFailed("sessionName must be non-empty"))

    val id   = newSessionId()
    val host = newToken()

    val info = SessionInfo(
      sessionName = sn,
      hostName    = hn,
      hostToken   = host,
      hostUserId  = principal.userId,
      guestName   = None,
      guestToken  = None,
      guestUserId = None
    )

    sessionRepo.set(id, info)
    Right(SessionCreated(id, host))
  }

  override def getSession(id: GameSessionId): Either[GameSessionError, SessionInfo] =
    getSessionOpt(id).toRight(GameSessionError.NotFound(id))

  override def leaveSession(
    principal: AuthPrincipal,
    id: GameSessionId
    ): Either[GameSessionError, SessionInfo] =
      getSessionOpt(id) match {
        case None => Left(NotFound(id))
        case Some(info) =>
          if (!isAuthorized(info, principal)) Left(Unauthorized(id, principal.userId))
          else if (info.hostUserId == principal.userId) {
            sessionRepo.clear(id)
            Left(CommandFailed("Session closed"))
          } else {
            val updated = info.copy(
              guestName = None,
              guestToken = None,
              guestUserId = None
            )
            updateSession(id, updated)
            Right(updated)
          }
      }


  override def joinSession(
    principal: AuthPrincipal,
    id: GameSessionId,
    guestName: String
  ): Either[GameSessionError, SessionJoined] =
    getSessionOpt(id) match {

      case None =>
        Left(NotFound(id))

      case Some(info) if info.guestToken.isDefined =>
        Left(SessionFull(id))

      case Some(info) =>
        val gn = guestName.trim
        if (gn.isEmpty) return Left(CommandFailed("guestName must be non-empty"))

        val guestToken = newToken()

        gameUseCases.createGame(info.hostName, gn, id) match {
          case Left(err) =>
            Left(CommandFailed(err.message))

          case Right(_) =>
            ctxRepo.get(id) match {
              case None =>
                Left(CommandFailed("Game context missing after createGame"))

              case Some(ctx) =>
                val updated = info.copy(
                  guestName   = Some(gn),
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
    getSessionOpt(id) match {
      case None =>
        Left(NotFound(id))

      case Some(info) =>
        if (!isAuthorized(info, principal))
          Left(Unauthorized(id, principal.userId))
        else
          executeCommandThroughUseCases(id, cmd)
    }

  private def isAuthorized(info: SessionInfo, p: AuthPrincipal): Boolean =
    info.hostUserId == p.userId || info.guestUserId.contains(p.userId)

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
