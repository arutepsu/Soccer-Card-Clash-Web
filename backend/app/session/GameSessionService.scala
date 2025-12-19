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
      guestUserId = None,
      state       = SessionState.Waiting
    )

    sessionRepo.set(id, info)
    Right(SessionCreated(id, host))
  }

  override def startSession(
    principal: AuthPrincipal,
    id: GameSessionId
  ): Either[GameSessionError, GameContext] =
    getSessionOpt(id) match {

      case None =>
        Left(NotFound(id))

      case Some(info) =>
        if (!isAuthorized(info, principal))
          Left(Unauthorized(id, principal.userId))
        else if (info.hostUserId != principal.userId)
          Left(CommandFailed("Only host can start the game"))
        else if (info.guestName.isEmpty)
          Left(CommandFailed("Cannot start: waiting for guest to join"))
        else if (info.state != SessionState.Ready)
          Left(CommandFailed("Session is not ready to start"))
        else {

        gameUseCases
          .createGame(info.hostName, info.guestName.get, id, Some(principal))
          .match {
            case Left(err) =>
              Left(CommandFailed(err.message))

            case Right(_) =>
              ctxRepo.get(id) match {
                case None =>
                  Left(CommandFailed("Game context missing after startSession"))

                case Some(ctx) =>
                  val startedInfo = info.copy(state = SessionState.Started)
                  updateSession(id, startedInfo)
                  Right(ctx)
              }
          }
        }
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

      case Some(info) if info.state != SessionState.Waiting =>
        Left(CommandFailed("Cannot join: session already started"))

      case Some(info) =>
        val gn = guestName.trim
        if (gn.isEmpty) return Left(CommandFailed("guestName must be non-empty"))

        val guestToken = newToken()

        val updated = info.copy(
          guestName   = Some(gn),
          guestToken  = Some(guestToken),
          guestUserId = Some(principal.userId),
          state       = SessionState.Ready
        )

        updateSession(id, updated)
        Right(SessionJoined(id, guestToken))

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
          executeCommandThroughUseCases(id, principal, cmd)
    }

  private def isAuthorized(info: SessionInfo, p: AuthPrincipal): Boolean =
    info.hostUserId == p.userId || info.guestUserId.contains(p.userId)

  private def executeCommandThroughUseCases(
    id: GameSessionId,
    principal: AuthPrincipal,
    cmd: GameCommand
  ): Either[GameSessionError, GameContext] = {

    val result: Either[AppError, _] = cmd match {
      case GameCommand.SingleAttack(index) =>
        gameUseCases.singleAttack(index, id, principal)

      case GameCommand.DoubleAttack(index) =>
        gameUseCases.doubleAttack(index, id, principal)

      case GameCommand.Boost(index, goalkeeper) =>
        gameUseCases.boost(index, id, goalkeeper, principal)

      case GameCommand.RegularSwap(index) =>
        gameUseCases.swap(index, id, principal)

      case GameCommand.ReverseSwap =>
        gameUseCases.reverseSwap(id, principal)

      case GameCommand.Undo =>
        gameUseCases.undo(id, principal)

      case GameCommand.Redo =>
        gameUseCases.redo(id, principal)

      case GameCommand.ExecuteAI(action) =>
        gameUseCases.executeAI(action, id, principal)

      case GameCommand.CreateGame(p1, p2) =>
        gameUseCases.createGame(p1, p2, id, Some(principal))

      case GameCommand.CreateGameWithAI(human, aiName) =>
        gameUseCases.createGameWithAI(human, aiName, id, Some(principal))

      case GameCommand.LoadGame(fileName) =>
        gameUseCases.load(fileName, id, Some(principal))

      case GameCommand.SaveGame =>
        gameUseCases.save(id, Some(principal))

      case GameCommand.GetState =>
        gameUseCases.state(id, Some(principal))
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
