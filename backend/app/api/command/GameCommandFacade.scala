package app.api.command

import javax.inject._
import scala.util.control.NonFatal
import app.api.eventHub.GameEventHub
import app.auth.AuthPrincipal
import app.models.state.WebGameState
import app.models.AppError
import app.session.{GameSessionError, GameSessionId}
import app.api.context.IGameContextRepository
import app.session.IGameSessionService
import app.mapping.IViewStateMapper
import app.api.usecases.IGameUseCases
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext

@Singleton
final class GameCommandFacade @Inject()(
  sessionService: IGameSessionService,
  gameUseCases: IGameUseCases,
  ctxRepo: IGameContextRepository,
  viewStateMapper: IViewStateMapper,
  eventHub: GameEventHub
) extends IGameCommandFacade {

  override def execute(
    sid: GameSessionId,
    principal: Option[AuthPrincipal],
    cmd: GameCommand,
    requestId: Option[String]
  ): Either[AppError, WebGameState] = {

    val ctxE: Either[AppError, GameContext] =
      principal match {
        case Some(p) =>
          // ONLINE multiplayer (auth required): must have session + user must be member
          sessionService.submitCommand(sid, p, cmd) match {
            case Left(err)  => Left(AppError(errorMessage(err)))
            case Right(ctx) => Right(ctx)
          }

        case None =>
          // LOCAL / OFFLINE: no sessionRepo needed
          executeLocally(sid, cmd)
      }

    ctxE.map { ctx =>
      val web: WebGameState = viewStateMapper.toWebState(ctx)
      eventHub.publish(sid, web)
      web
    }
  }

  private def executeLocally(
    sid: GameSessionId,
    cmd: GameCommand
  ): Either[AppError, GameContext] = {

    val res: Either[AppError, _] =
      try {
        cmd match {
          case GameCommand.SingleAttack(index) =>
            gameUseCases.singleAttack(index, sid)
          case GameCommand.DoubleAttack(index) =>
            gameUseCases.doubleAttack(index, sid)
          case GameCommand.Boost(index, goalkeeper) =>
            gameUseCases.boost(index, sid, goalkeeper)
          case GameCommand.RegularSwap(index) =>
            gameUseCases.swap(index, sid)
          case GameCommand.ReverseSwap =>
            gameUseCases.reverseSwap(sid)
          case GameCommand.Undo =>
            gameUseCases.undo(sid)
          case GameCommand.Redo =>
            gameUseCases.redo(sid)
          case GameCommand.ExecuteAI(action) =>
            gameUseCases.executeAI(action, sid)
          case GameCommand.CreateGame(p1, p2) =>
            gameUseCases.createGame(p1, p2, sid)
          case GameCommand.CreateGameWithAI(human, aiName) =>
            gameUseCases.createGameWithAI(human, aiName, sid)
          case GameCommand.LoadGame(fileName) =>
            gameUseCases.load(fileName, sid)
          case GameCommand.SaveGame =>
            gameUseCases.save(sid)
          case GameCommand.QuitGame =>
            gameUseCases.quit()
          case GameCommand.GetState =>
            gameUseCases.state(sid)
        }
      } catch {
        case NonFatal(e) =>
          Left(AppError(s"Local command execution failed: ${e.getMessage}"))
      }

    res.flatMap { _ =>
      ctxRepo.get(sid) match {
        case Some(ctx) => Right(ctx)
        case None      => Left(AppError("Game context missing after local command execution"))
      }
    }
  }

  private def errorMessage(err: GameSessionError): String =
    err match {
      case GameSessionError.NotFound(id) =>
        s"Session not found: ${id.value}"

      case GameSessionError.Unauthorized(id, userId) =>
        s"Unauthorized: user $userId cannot act in session ${id.value}"

      case GameSessionError.SessionFull(id) =>
        s"Session is full: ${id.value}"

      case GameSessionError.AlreadyJoined(id) =>
        s"Session already joined: ${id.value}"

      case GameSessionError.CommandFailed(msg) =>
        msg
    }
}
