package app.api.push

import play.api.libs.json.OFormat.oFormatFromReadsAndOWrites
import play.api.libs.json.Format.GenericFormat
import akka.actor.ActorSystem
import akka.stream.{Materializer, OverflowStrategy}
import akka.stream.scaladsl.{BroadcastHub, Keep, Source}
import app.models.view._
import app.models.state.WebGameState 
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import javax.inject._
import play.api.libs.json._
import app.api.IGameUseCases
import app.api.push.protocol.MessageTypes._
import app.api.push.protocol.Envelope
import de.htwg.se.soccercardclash.util._
import app.models.AppError
import app.session.IGameSessionService
import app.mapping.IViewStateMapper
import app.session._
import app.domain.commands.GameCommand
import app.api.services.GameEventHub

@Singleton
class GamePushService @Inject()(
  sessionService: IGameSessionService,
  viewStateMapper: IViewStateMapper,
  eventHub: GameEventHub
)(implicit system: ActorSystem, mat: Materializer)
  extends IGamePushService {


  private val (queue, hub) = {
    val src = Source.queue[Envelope](bufferSize = 256, OverflowStrategy.dropTail)
    src.toMat(BroadcastHub.sink(bufferSize = 512))(Keep.both).run()
  }

  override def eventStream(gameId: String): Source[Envelope, _] = {
    val id = GameSessionId(gameId)
    hub.filter(_.gameId == id.value)
  }

  private def pushState(id: GameSessionId, ctx: GameContext, requestId: Option[String]): Unit = {
    val web: WebGameState = viewStateMapper.toWebState(ctx)

    //publish to GameEventHub so SSE/Comet can see this update
    eventHub.publish(id, web)

    queue.offer(
      Envelope(
        kind      = "event",
        `type`    = StateUpdated,
        gameId    = id.value,
        playerId  = None,
        requestId = requestId,
        payload   = Json.toJson(web)
      )
    )
  }


  private def pushError(id: GameSessionId, msg: String, requestId: Option[String]): Unit =
    queue.offer(
      Envelope(
        kind      = "error",
        `type`    = GameError,
        gameId    = id.value,
        requestId = requestId,
        payload   = Json.toJson(AppError(msg))
      )
    )

  private val DefenderIndexRange = 0 to 2

  private def validateDefenderIndex(i: Int): Either[String, Int] =
    if (DefenderIndexRange.contains(i)) Right(i)
    else Left(s"Defender index out of range: $i (expected ${DefenderIndexRange.start}..${DefenderIndexRange.end})")

  private sealed trait AttackTarget
  private object AttackTarget {
    final case class DefenderAt(index: Int) extends AttackTarget
    case object Goalkeeper extends AttackTarget
  }

  private def toTarget(dto: RegularAttackCommandView): Either[String, AttackTarget] =
    dto.target.toLowerCase match {
      case "goalkeeper" =>
        Right(AttackTarget.Goalkeeper)

      case "defender" =>
        dto.index match {
          case Some(i) => validateDefenderIndex(i).map(AttackTarget.DefenderAt.apply)
          case None    => Left("Missing 'index' for target=defender")
        }

      case other =>
        Left(s"Unknown target: $other")
    }

  private def errorMessage(err: GameSessionError): String =
    err match {
      case GameSessionError.NotFound(id) =>
        s"Session not found: ${id.value}"
      case GameSessionError.Unauthorized(id, token) =>
        s"Unauthorized: token ${token.value} cannot act in session ${id.value}"
      case GameSessionError.SessionFull(id) =>
        s"Session is full: ${id.value}"
      case GameSessionError.AlreadyJoined(id) =>
        s"Session already joined: ${id.value}"
      case GameSessionError.CommandFailed(msg) =>
        msg
    }

  private def withSessionAndToken(env: Envelope)(
    f: (GameSessionId, PlayerToken) => Unit
  ): Unit = {
    val sid = GameSessionId(env.gameId)
    env.playerId match {
      case None =>
        pushError(sid, "Missing playerId in command envelope", env.requestId)
      case Some(pidStr) =>
        val token = PlayerToken(pidStr)
        f(sid, token)
    }
  }

  private def runCommand(
    env: Envelope,
    sid: GameSessionId,
    token: PlayerToken,
    cmd: GameCommand
  ): Unit = {
    sessionService.submitCommand(sid, token, cmd) match {
      case Left(err) =>
        pushError(sid, errorMessage(err), env.requestId)
      case Right(ctx) =>
        pushState(sid, ctx, env.requestId)
    }
  }

  override def handleCommand(env: Envelope): Unit = {
    if (env.kind != "command") return

    env.`type` match {
      case CreateGame        => handleCreateGame(env)
      case CreateGameWithAI  => handleCreateGameWithAI(env)
      case LoadGame          => handleLoadGame(env)
      case SaveGame          => handleSaveGame(env)
      case QuitGame          => handleQuitGame(env)
      case GetState          => handleGetState(env)

      case RegularAttack     => handleRegularAttack(env)
      case DoubleAttack      => handleDoubleAttack(env)
      case Boost             => handleBoost(env)
      case RegularSwap       => handleRegularSwap(env)
      case ReverseSwap       => handleReverseSwap(env)
      case Undo              => handleUndo(env)
      case Redo              => handleRedo(env)
      case ExecuteAI         => handleExecuteAI(env)

      case other =>
        val sid = GameSessionId(env.gameId)
        pushError(sid, s"Unknown command type: $other", env.requestId)
    }
  }

  private def handleCreateGame(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      val dto = env.payload.as[CreateGameCommandView]
      runCommand(env, sid, token, GameCommand.CreateGame(dto.p1, dto.p2))
    }

  private def handleCreateGameWithAI(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      val dto = env.payload.as[CreateGameWithAICommandView]
      runCommand(env, sid, token, GameCommand.CreateGameWithAI(dto.humanPlayer, dto.aiName))
    }

  private def handleLoadGame(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      val dto = env.payload.as[LoadGameCommandView]
      runCommand(env, sid, token, GameCommand.LoadGame(dto.fileName))
    }

  private def handleSaveGame(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      runCommand(env, sid, token, GameCommand.SaveGame)
    }

  private def handleQuitGame(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      runCommand(env, sid, token, GameCommand.QuitGame)
    }

  private def handleGetState(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      runCommand(env, sid, token, GameCommand.GetState)
    }

  private def handleRegularAttack(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      val dto = env.payload.as[RegularAttackCommandView]

      toTarget(dto) match {
        case Left(msg) =>
          pushError(sid, msg, env.requestId)

        case Right(AttackTarget.Goalkeeper) =>
          runCommand(env, sid, token, GameCommand.SingleAttack(-1))

        case Right(AttackTarget.DefenderAt(i)) =>
          runCommand(env, sid, token, GameCommand.SingleAttack(i))
      }
    }

  private def handleDoubleAttack(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      val dto       = env.payload.as[DoubleAttackCommandView]
      val asRegular = RegularAttackCommandView(dto.target, Some(dto.index))

      toTarget(asRegular) match {
        case Left(msg) =>
          pushError(sid, msg, env.requestId)

        case Right(AttackTarget.Goalkeeper) =>
          pushError(sid, "Double-attack against goalkeeper is not allowed", env.requestId)

        case Right(AttackTarget.DefenderAt(i)) =>
          runCommand(env, sid, token, GameCommand.DoubleAttack(i))
      }
    }

  private def handleBoost(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      val dto = env.payload.as[BoostCommandView]

      dto.target.toLowerCase match {
        case "goalkeeper" =>
          runCommand(env, sid, token, GameCommand.Boost(-1, goalkeeper = true))

        case "defender" =>
          dto.index match {
            case Some(i) =>
              validateDefenderIndex(i) match {
                case Left(msg) =>
                  pushError(sid, msg, env.requestId)
                case Right(validIndex) =>
                  runCommand(env, sid, token, GameCommand.Boost(validIndex, goalkeeper = false))
              }

            case None =>
              pushError(sid, "Missing 'index' for target=defender", env.requestId)
          }

        case other =>
          pushError(sid, s"Unknown target: $other", env.requestId)
      }
    }

  private def handleRegularSwap(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      val dto = env.payload.as[RegularSwapCommandView]
      runCommand(env, sid, token, GameCommand.RegularSwap(dto.index))
    }

  private def handleReverseSwap(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      runCommand(env, sid, token, GameCommand.ReverseSwap)
    }

  private def handleUndo(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      runCommand(env, sid, token, GameCommand.Undo)
    }

  private def handleRedo(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      runCommand(env, sid, token, GameCommand.Redo)
    }

  private def handleExecuteAI(env: Envelope): Unit =
    withSessionAndToken(env) { (sid, token) =>
      val dto = env.payload.as[AIActionCommandView]
      toAIAction(dto, sid, env.requestId) match {
        case Some(aiAction) =>
          runCommand(env, sid, token, GameCommand.ExecuteAI(aiAction))
        case None =>
          () // error already pushed by toAIAction
      }
    }

  private def toZone(s: String): Option[Zone] =
    s.toLowerCase match {
      case "defender"   => Some(DefenderZone)
      case "goalkeeper" => Some(GoalkeeperZone)
      case _            => None
    }

  private def toAIAction(dto: AIActionCommandView, sid: GameSessionId, requestId: Option[String]): Option[AIAction] =
    dto.kind match {
      case "SingleAttack" =>
        dto.defenderIndex match {
          case Some(i) => Some(SingleAttackAIAction(i))
          case None =>
            pushError(sid, "Missing 'defenderIndex' for AIAction kind=SingleAttack", requestId)
            None
        }

      case "DoubleAttack" =>
        dto.defenderIndex match {
          case Some(i) => Some(DoubleAttackAIAction(i))
          case None =>
            pushError(sid, "Missing 'defenderIndex' for AIAction kind=DoubleAttack", requestId)
            None
        }

      case "RegularSwap" =>
        dto.handIndex match {
          case Some(i) => Some(RegularSwapAIAction(i))
          case None =>
            pushError(sid, "Missing 'handIndex' for AIAction kind=RegularSwap", requestId)
            None
        }

      case "ReverseSwap" =>
        Some(ReverseSwapAIAction)

      case "Undo" =>
        Some(UndoAIAction)

      case "Redo" =>
        Some(RedoAIAction)

      case "NoOp" =>
        Some(NoOpAIAction)

      case "Boost" =>
        (dto.handIndex, dto.zone.flatMap(toZone)) match {
          case (Some(idx), Some(z)) =>
            Some(BoostAIAction(idx, z))

          case (None, _) =>
            pushError(sid, "Missing 'handIndex' for AIAction kind=Boost", requestId)
            None

          case (_, None) =>
            pushError(sid, "Missing or invalid 'zone' for AIAction kind=Boost (expected 'defender' or 'goalkeeper')", requestId)
            None
        }

      case other =>
        pushError(sid, s"Unknown AI action kind: $other", requestId)
        None
    }
}
