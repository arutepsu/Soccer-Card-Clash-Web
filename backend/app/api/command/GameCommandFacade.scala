package app.api.command

import javax.inject._

import app.auth.AuthPrincipal
import app.api.eventHub.GameEventHub
import app.mapping.IViewStateMapper
import app.models.AppError
import app.models.state.WebGameState
import app.session.{GameSessionError, GameSessionId, IGameSessionService, PlayerToken}
import app.api.usecases.IGameUseCases
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import play.api.libs.json.{JsObject, Json}

@Singleton
final class GameCommandFacade @Inject()(
  sessionService: IGameSessionService,
  gameUseCases: IGameUseCases,
  viewStateMapper: IViewStateMapper,
  eventHub: GameEventHub
) extends IGameCommandFacade {

  private val LocalPrincipal: AuthPrincipal =
    AuthPrincipal(userId = "local", email = None, nickname = Some("local"))

  private def effectivePrincipal(mode: CommandMode, p: Option[AuthPrincipal]): Option[AuthPrincipal] =
    mode match {
      case CommandMode.local  => p.orElse(Some(LocalPrincipal))
      case CommandMode.online => p
    }

  override def execute(
    mode: CommandMode,
    sid: GameSessionId,
    principal: Option[AuthPrincipal],
    cmd: GameCommand,
    token: Option[PlayerToken],
    meta: Option[JsObject] = None
  ): Either[AppError, WebGameState] = {

    val eff = effectivePrincipal(mode, principal)

    val ctxE: Either[AppError, GameContext] =
      mode match {
        case CommandMode.online =>
          (eff, token) match {
            case (Some(p), Some(t)) =>
              sessionService
                .submitCommand(sid, p, t, cmd)
                .left.map(err => AppError(errorMessage(err)))

            case (None, _)  => Left(AppError("Missing principal for online command"))
            case (_, None)  => Left(AppError("Missing playerToken for online command"))
          }

        case CommandMode.local =>
          eff match {
            case Some(p) => executeLocallyCtx(sid, cmd, p)
            case None    => Left(AppError("Principal resolution failed"))
          }
      }

    ctxE.map { ctx =>
      val infoOpt =
        mode match {
          case CommandMode.online => sessionService.getSession(sid).toOption
          case CommandMode.local  => None
        }

      val web = viewStateMapper.toWebState(ctx, eff, infoOpt)

      val baseMeta = Json.obj("mode" -> mode.toString)
      val mergedMeta = meta match {
        case Some(m) => baseMeta.deepMerge(m)
        case None    => baseMeta
      }

      eventHub.publish(sid = sid, ctx = ctx, meta = mergedMeta)
      web
    }
  }


  private def executeLocallyCtx(
    sid: GameSessionId,
    cmd: GameCommand,
    p: AuthPrincipal
  ): Either[AppError, GameContext] = {

    val res: Either[AppError, WebGameState] = cmd match {
      case GameCommand.SingleAttack(i)          => gameUseCases.singleAttack(i, sid, p)
      case GameCommand.DoubleAttack(i)          => gameUseCases.doubleAttack(i, sid, p)
      case GameCommand.Boost(i, gk)             => gameUseCases.boost(i, sid, gk, p)
      case GameCommand.RegularSwap(i)           => gameUseCases.swap(i, sid, p)
      case GameCommand.ReverseSwap              => gameUseCases.reverseSwap(sid, p)
      case GameCommand.Undo                     => gameUseCases.undo(sid, p)
      case GameCommand.Redo                     => gameUseCases.redo(sid, p)
      case GameCommand.ExecuteAI(a)             => gameUseCases.executeAI(a, sid, p)

      case GameCommand.CreateGame(p1, p2)       => gameUseCases.createGame(p1, p2, sid, Some(p))
      case GameCommand.CreateGameWithAI(h, ai)  => gameUseCases.createGameWithAI(h, ai, sid, Some(p))
      case GameCommand.LoadGame(f)              => gameUseCases.load(f, sid, Some(p))
      case GameCommand.SaveGame                 => gameUseCases.save(sid, Some(p))
      case GameCommand.GetState                 => gameUseCases.state(sid, Some(p))
    }

    res.flatMap(_ =>
      gameUseCases
        .getCtx(sid)
        .toRight(AppError("Game context missing after local command"))
    )
  }

  private def errorMessage(err: GameSessionError): String = err match {
    case GameSessionError.NotFound(id)          => s"Session not found: ${id.value}"
    case GameSessionError.Unauthorized(id, uid) => s"Unauthorized: user $uid cannot act in session ${id.value}"
    case GameSessionError.InvalidToken(id)      => s"Invalid player token for session ${id.value}"
    case GameSessionError.SessionFull(id)       => s"Session is full: ${id.value}"
    case GameSessionError.AlreadyJoined(id)     => s"Session already joined: ${id.value}"
    case GameSessionError.CommandFailed(msg)    => msg
  }
}
