package app.services

import play.api.libs.json.OFormat.oFormatFromReadsAndOWrites
import play.api.libs.json.Format.GenericFormat
import akka.actor.ActorSystem
import akka.stream.{Materializer, OverflowStrategy}
import akka.stream.scaladsl.{BroadcastHub, Keep, Source}
import app.models.view._
import app.models.state.WebGameState 
import javax.inject._
import play.api.libs.json._
import app.api.IGameUseCases
import app.protocol.MessageTypes._
import app.protocol.Envelope
import de.htwg.se.soccercardclash.util._
import app.models.AppError

@Singleton
class GamePushService @Inject()(
  gameUseCases: IGameUseCases
)(implicit system: ActorSystem, mat: Materializer)
  extends IGamePushService {

  private val (queue, hub) = {
    val src = Source.queue[Envelope](bufferSize = 256, OverflowStrategy.dropTail)
    src.toMat(BroadcastHub.sink(bufferSize = 512))(Keep.both).run()
  }

  override def eventStream(gameId: String): Source[Envelope, _] =
    hub.filter(_.gameId == gameId)

  private def pushState(sid: String, web: WebGameState, requestId: Option[String]): Unit =
    queue.offer(
      Envelope(
        kind      = "event",
        `type`    = StateUpdated,
        gameId    = sid,
        playerId  = None,
        requestId = requestId,
        payload   = Json.toJson(web)
      )
    )

  private def pushError(sid: String, msg: String, requestId: Option[String]): Unit =
    queue.offer(
      Envelope(
        kind      = "error",
        `type`    = GameError,
        gameId    = sid,
        requestId = requestId,
        payload   = Json.toJson(AppError(msg))
      )
    )


  private sealed trait AttackTarget
  private object AttackTarget {
    final case class DefenderAt(index: Int) extends AttackTarget
    case object Goalkeeper extends AttackTarget
  }

  private def toTarget(dto: RegularAttackCommandView): Either[String, AttackTarget] =
    dto.target.toLowerCase match {
      case "goalkeeper" => Right(AttackTarget.Goalkeeper)
      case "defender" =>
        dto.index match {
          case Some(i) if i >= 0 && i <= 2 => Right(AttackTarget.DefenderAt(i))
          case Some(i) => Left(s"Defender index out of range: $i (expected 0..2)")
          case None    => Left("Missing 'index' for target=defender")
        }
      case other => Left(s"Unknown target: $other")
    }

  override def handleCommand(env: Envelope): Unit = {
    if (env.kind != "command") return

    val sid = env.gameId

    env.`type` match {

      case CreateGame =>
        val dto = env.payload.as[CreateGameCommandView]
        gameUseCases.createGame(dto.p1, dto.p2, sid) match {
          case Right(web) => pushState(sid, web, env.requestId)
          case Left(err)  => pushError(sid, err.message, env.requestId)
        }

      case CreateGameWithAI =>
        val dto = env.payload.as[CreateGameWithAICommandView]
        gameUseCases.createGameWithAI(dto.humanPlayer, dto.aiName, sid) match {
          case Right(web) => pushState(sid, web, env.requestId)
          case Left(err)  => pushError(sid, err.message, env.requestId)
        }

      case LoadGame =>
        val dto = env.payload.as[LoadGameCommandView]
        gameUseCases.load(dto.fileName, sid) match {
          case Right(web) => pushState(sid, web, env.requestId)
          case Left(err)  => pushError(sid, err.message, env.requestId)
        }

      case SaveGame =>
        gameUseCases.save(sid) match {
          case Right(web) => pushState(sid, web, env.requestId)
          case Left(err)  => pushError(sid, err.message, env.requestId)
        }

      case QuitGame =>
        gameUseCases.quit() match {
          case Right(_)   => ()
          case Left(err)  => pushError(sid, err.message, env.requestId)
        }

      case GetState =>
        gameUseCases.state(sid) match {
          case Right(web) => pushState(sid, web, env.requestId)
          case Left(err)  => pushError(sid, err.message, env.requestId)
        }

      case RegularAttack =>
        val dto = env.payload.as[RegularAttackCommandView]
        toTarget(dto) match {
          case Left(msg) =>
            pushError(sid, msg, env.requestId)

          case Right(AttackTarget.Goalkeeper) =>
            gameUseCases.singleAttack(-1, sid) match {
              case Right(web) => pushState(sid, web, env.requestId)
              case Left(err)  => pushError(sid, err.message, env.requestId)
            }

          case Right(AttackTarget.DefenderAt(i)) =>
            gameUseCases.singleAttack(i, sid) match {
              case Right(web) => pushState(sid, web, env.requestId)
              case Left(err)  => pushError(sid, err.message, env.requestId)
            }
        }

      case DoubleAttack =>
        val dto = env.payload.as[DoubleAttackCommandView]

        toTarget(RegularAttackCommandView(dto.target, Some(dto.index))) match {

          case Left(msg) =>
            pushError(sid, msg, env.requestId)

          case Right(AttackTarget.Goalkeeper) =>
            pushError(sid, "Double-attack against goalkeeper is not allowed", env.requestId)

          case Right(AttackTarget.DefenderAt(i)) =>
            gameUseCases.doubleAttack(i, sid) match {
              case Right(web) => pushState(sid, web, env.requestId)
              case Left(err)  => pushError(sid, err.message, env.requestId)
            }
        }


      case Boost =>
        val dto = env.payload.as[BoostCommandView]
        dto.target.toLowerCase match {
          case "goalkeeper" =>
            gameUseCases.boost(-1, sid, goalkeeper = true) match {
              case Right(web) => pushState(sid, web, env.requestId)
              case Left(err)  => pushError(sid, err.message, env.requestId)
            }
          case "defender" =>
            dto.index match {
              case Some(i) if i >= 0 && i <= 2 =>
                gameUseCases.boost(i, sid, goalkeeper = false) match {
                  case Right(web) => pushState(sid, web, env.requestId)
                  case Left(err)  => pushError(sid, err.message, env.requestId)
                }
              case Some(i) =>
                pushError(sid, s"Defender index out of range: $i (expected 0..2)", env.requestId)
              case None =>
                pushError(sid, "Missing 'index' for target=defender", env.requestId)
            }
          case other =>
            pushError(sid, s"Unknown target: $other", env.requestId)
        }

      case RegularSwap =>
        val dto = env.payload.as[RegularSwapCommandView]
        gameUseCases.swap(dto.index, sid) match {
          case Right(web) => pushState(sid, web, env.requestId)
          case Left(err)  => pushError(sid, err.message, env.requestId)
        }

      case ReverseSwap =>
        gameUseCases.reverseSwap(sid) match {
          case Right(web) => pushState(sid, web, env.requestId)
          case Left(err)  => pushError(sid, err.message, env.requestId)
        }

      case Undo =>
        gameUseCases.undo(sid) match {
          case Right(web) => pushState(sid, web, env.requestId)
          case Left(err)  => pushError(sid, err.message, env.requestId)
        }

      case Redo =>
        gameUseCases.redo(sid) match {
          case Right(web) => pushState(sid, web, env.requestId)
          case Left(err)  => pushError(sid, err.message, env.requestId)
        }
      case ExecuteAI =>
        val dto = env.payload.as[AIActionCommandView]
        toAIAction(dto, sid, env.requestId) match {
          case Some(aiAction) =>
            gameUseCases.executeAI(aiAction, sid) match {
              case Right(web) => pushState(sid, web, env.requestId)
              case Left(err)  => pushError(sid, err.message, env.requestId)
            }
          case None =>
        }



      case other =>
        pushError(sid, s"Unknown command type: $other", env.requestId)
    }
  }
  private def toZone(s: String): Option[Zone] =
    s.toLowerCase match {
      case "defender"   => Some(DefenderZone)
      case "goalkeeper" => Some(GoalkeeperZone)
      case _            => None
    }

  private def toAIAction(dto: AIActionCommandView, sid: String, requestId: Option[String]): Option[AIAction] =
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
