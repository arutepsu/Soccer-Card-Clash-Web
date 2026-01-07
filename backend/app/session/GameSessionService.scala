package app.session

import javax.inject._
import app.api.usecases.IGameUseCases
import app.api.command.GameCommand
import app.models.AppError
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import app.api.context.IGameContextRepository
import app.session.repositories.IGameSessionRepository
import GameSessionError._
import app.auth.AuthPrincipal
import app.session.SessionInfo.norm
import app.api.eventHub.GameEventHub
import play.api.libs.json.Json

@Singleton
final class GameSessionService @Inject()(
  gameUseCases: IGameUseCases,
  ctxRepo: IGameContextRepository,
  sessionRepo: IGameSessionRepository,
  eventHub: GameEventHub
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
    
  private def publishSessionEnded(id: GameSessionId, leftName: String, reason: String): Unit = {
    ctxRepo.get(id).foreach { ctx =>
      eventHub.publish(
        sid = id,
        ctx = ctx,
        meta = Json.obj(
          "action" -> "SessionEnded",
          "leftPlayerName" -> leftName,
          "reason" -> reason
        )
      )
    }
  }

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
    token: PlayerToken,
    id: GameSessionId
  ): Either[GameSessionError, GameContext] =
    getSessionOpt(id) match {

      case None =>
        Left(NotFound(id))

      case Some(info) =>
        if (!isAuthorized(info, principal, token))
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
                gameUseCases.getCtx(id) match {
                  case None =>
                    Left(CommandFailed("Game context missing after startSession"))

                  case Some(ctx) =>
                    val hostKey  = norm(info.hostName)
                    val guestKey = norm(info.guestName.get)
                    val guestUid = info.guestUserId.getOrElse {
                      return Left(CommandFailed("Cannot start: guestUserId missing"))
                    }

                    val mapping =
                      info.nameToUserId ++ Map(
                        hostKey  -> info.hostUserId,
                        guestKey -> guestUid
                      )

                    val startedInfo = info.copy(
                      state        = SessionState.Started,
                      nameToUserId = mapping
                    )

                    updateSession(id, startedInfo)
                    Right(ctx)
                }
            }
        }
    }

  override def getSession(id: GameSessionId): Either[GameSessionError, SessionInfo] =
    getSessionOpt(id).toRight(GameSessionError.NotFound(id))

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

        val hostKey  = norm(info.hostName)
        val guestKey = norm(gn)

        if (guestKey == hostKey)
          return Left(CommandFailed("guestName must be different from hostName"))

        if (info.nameToUserId.contains(guestKey))
          return Left(CommandFailed("guestName already taken"))

        val guestToken = newToken()

        val mapping =
          info.nameToUserId ++ Map(
            norm(info.hostName) -> info.hostUserId,
            norm(gn)            -> principal.userId
          )

        val updated = info.copy(
          guestName    = Some(gn),
          guestToken   = Some(guestToken),
          guestUserId  = Some(principal.userId),
          state        = SessionState.Ready,
          nameToUserId = mapping
        )

        updateSession(id, updated)
        Right(SessionJoined(id, guestToken))

    }

  override def submitCommand(
    id: GameSessionId,
    principal: AuthPrincipal,
    token: PlayerToken,
    cmd: GameCommand
  ): Either[GameSessionError, GameContext] =
    getSessionOpt(id) match {
      case None =>
        Left(NotFound(id))

      case Some(info) =>
        if (!isAuthorized(info, principal, token))
          Left(Unauthorized(id, principal.userId))
        else
          executeCommandThroughUseCases(id, principal, cmd)
    }

  private def isAuthorized(info: SessionInfo, p: AuthPrincipal, t: PlayerToken): Boolean = {
    val hostOk =
      info.hostUserId == p.userId && info.hostToken == t

    val guestOk =
      info.guestUserId.contains(p.userId) && info.guestToken.contains(t)

    hostOk || guestOk
  }

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
        gameUseCases.getCtx(id) match {
          case None =>
            Left(CommandFailed("Game context missing after command execution"))
          case Some(ctx) =>
            Right(ctx)
        }
    }
  }

  override def leaveSession(
    principal: AuthPrincipal,
    token: PlayerToken,
    id: GameSessionId
  ): Either[GameSessionError, SessionInfo] =
    leaveSessionWithReason(principal, token, id, reason = "mainmenu")

  override def leaveSessionDisconnected(
    principal: AuthPrincipal,
    token: PlayerToken,
    id: GameSessionId
  ): Either[GameSessionError, SessionInfo] = {
    markDisconnected(principal, token, id)
    getSession(id)
  }

  private def displayName(p: AuthPrincipal): String =
            p.nickname
              .map(_.trim).filter(_.nonEmpty)
              .orElse(p.email.map(_.trim).filter(_.nonEmpty))
              .getOrElse(p.userId.take(8))
              
  private def leaveSessionWithReason(
    principal: AuthPrincipal,
    token: PlayerToken,
    id: GameSessionId,
    reason: String
  ): Either[GameSessionError, SessionInfo] =
    getSessionOpt(id) match {
      case None => Left(NotFound(id))

      case Some(info) =>
        if (!isAuthorized(info, principal, token)) Left(Unauthorized(id, principal.userId))
        else {
          val isHost = info.hostUserId == principal.userId

          val leftName =
            if (isHost) info.hostName
            else info.guestName.getOrElse(displayName(principal))

          publishSessionEnded(id, leftName, reason)

          if (isHost) {
            sessionRepo.clear(id)
            Left(CommandFailed("Session closed"))
          } else {
            val guestKey = info.guestName.map(norm).getOrElse("")
            val updated = info.copy(
              guestName        = None,
              guestToken       = None,
              guestUserId      = None,
              guestConnected   = false,
              state            = SessionState.Waiting,
              nameToUserId     = if (guestKey.nonEmpty) info.nameToUserId - guestKey else info.nameToUserId
            )
            updateSession(id, updated)
            Right(updated)
          }
        }
    }
  override def markConnected(principal: AuthPrincipal, token: PlayerToken, id: GameSessionId): Unit =
    getSessionOpt(id).foreach { info =>
      if (!isAuthorized(info, principal, token)) ()
      else {
        val now = System.currentTimeMillis()
        val updated =
          if (info.hostUserId == principal.userId)
            info.copy(hostConnected = true, lastSeenHostMs = now)
          else
            info.copy(guestConnected = true, lastSeenGuestMs = now)

        updateSession(id, updated)
      }
    }

  override def markDisconnected(principal: AuthPrincipal, token: PlayerToken, id: GameSessionId): Unit =
    getSessionOpt(id).foreach { info =>
      if (!isAuthorized(info, principal, token)) ()
      else {
        val now = System.currentTimeMillis()
        val updated =
          if (info.hostUserId == principal.userId)
            info.copy(hostConnected = false, lastSeenHostMs = now)
          else
            info.copy(guestConnected = false, lastSeenGuestMs = now)

        updateSession(id, updated)
      }
    }
}
