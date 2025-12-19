package app.api.command

import scala.util.control.NonFatal
import javax.inject._

import app.auth.AuthPrincipal
import app.api.eventHub.GameEventHub
import app.api.command.IGameCommandFacade
import app.models.AppError
import app.models.state.WebGameState
import app.session.{GameSessionId, GameSessionError, IGameSessionService}
import app.mapping.IViewStateMapper
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import app.api.command.GameCommand
import app.api.usecases.IGameUseCases

@Singleton
final class GameCommandFacade @Inject()(
  sessionService: IGameSessionService,
  gameUseCases: IGameUseCases,
  viewStateMapper: IViewStateMapper,
  eventHub: GameEventHub
) extends IGameCommandFacade {

  private val LocalPrincipal: AuthPrincipal =
    AuthPrincipal(userId = "local", username = "local")

  private def effectivePrincipal(p: Option[AuthPrincipal]): Option[AuthPrincipal] =
    p.orElse(Some(LocalPrincipal))

  override def execute(
    sid: GameSessionId,
    principal: Option[AuthPrincipal],
    cmd: GameCommand,
    requestId: Option[String]
  ): Either[AppError, WebGameState] = {

    val eff = effectivePrincipal(principal)

    val ctxE: Either[AppError, GameContext] =
      eff match {
        case Some(p) if principal.isDefined =>
          sessionService
            .submitCommand(sid, p, cmd)
            .left.map(err => AppError(errorMessage(err)))

        case Some(p) =>
          executeLocallyCtx(sid, cmd, p)

        case None =>
          Left(AppError("Principal resolution failed"))
      }

    ctxE.map { ctx =>
      val infoOpt = sessionService.getSession(sid).toOption
      val web = viewStateMapper.toWebState(ctx, principal, infoOpt)
      eventHub.publish(sid, ctx)
      web
    }
  }

  private def executeLocallyCtx(
    sid: GameSessionId,
    cmd: GameCommand,
    p: AuthPrincipal
  ): Either[AppError, GameContext] = {

    val res: Either[AppError, WebGameState] = cmd match {
      case GameCommand.SingleAttack(i)     => gameUseCases.singleAttack(i, sid, p)
      case GameCommand.DoubleAttack(i)     => gameUseCases.doubleAttack(i, sid, p)
      case GameCommand.Boost(i, gk)        => gameUseCases.boost(i, sid, gk, p)
      case GameCommand.RegularSwap(i)      => gameUseCases.swap(i, sid, p)
      case GameCommand.ReverseSwap         => gameUseCases.reverseSwap(sid, p)
      case GameCommand.Undo                => gameUseCases.undo(sid, p)
      case GameCommand.Redo                => gameUseCases.redo(sid, p)
      case GameCommand.ExecuteAI(a)        => gameUseCases.executeAI(a, sid, p)

      case GameCommand.CreateGame(p1, p2)  => gameUseCases.createGame(p1, p2, sid, Some(p))
      case GameCommand.CreateGameWithAI(h, ai) => gameUseCases.createGameWithAI(h, ai, sid, Some(p))
      case GameCommand.LoadGame(f)         => gameUseCases.load(f, sid, Some(p))
      case GameCommand.SaveGame            => gameUseCases.save(sid, Some(p))
      case GameCommand.GetState            => gameUseCases.state(sid, Some(p))
    }

    res.flatMap(_ =>
      gameUseCases
        .getCtx(sid)
        .toRight(AppError("Game context missing after local command"))
    )
  }

  private def errorMessage(err: GameSessionError): String = err match {
    case GameSessionError.NotFound(id)           => s"Session not found: ${id.value}"
    case GameSessionError.Unauthorized(id, uid)  => s"Unauthorized: user $uid cannot act in session ${id.value}"
    case GameSessionError.SessionFull(id)        => s"Session is full: ${id.value}"
    case GameSessionError.AlreadyJoined(id)      => s"Session already joined: ${id.value}"
    case GameSessionError.CommandFailed(msg)     => msg
  }
}
