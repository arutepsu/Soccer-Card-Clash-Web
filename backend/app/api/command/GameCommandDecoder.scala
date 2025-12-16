package app.api.command

import javax.inject._
import play.api.libs.json._
import de.htwg.se.soccercardclash.util._
import app.models.AppError
import app.api.usecases.IGameUseCases
import app.api.protocol.Envelope
import app.models.view._

@Singleton
final class GameCommandDecoder @Inject()() {

  private val DefenderIndexRange = 0 to 2

  def fromEnvelope(env: Envelope): Either[AppError, GameCommand] = {
    if (env.kind != "command")
      Left(AppError(s"Envelope kind must be 'command' (got: ${env.kind})"))
    else
      fromTypeAndPayload(env.`type`, env.payload)
  }

  /** Decode REST JSON into a domain GameCommand.**/
  def fromRestJson(body: JsValue): Either[AppError, GameCommand] = {
    val tOpt = (body \ "type").asOpt[String]
    tOpt match {
      case None    => Left(AppError("Missing field 'type' in command JSON"))
      case Some(t) => fromTypeAndPayload(t, body)
    }
  }

  private def fromTypeAndPayload(tpe: String, payload: JsValue): Either[AppError, GameCommand] =
    tpe match {

      case "CreateGame" =>
        read[CreateGameCommandView](payload).map(v => GameCommand.CreateGame(v.p1, v.p2))

      case "CreateGameWithAI" =>
        read[CreateGameWithAICommandView](payload).map(v => GameCommand.CreateGameWithAI(v.humanPlayer, v.aiName))

      case "LoadGame" =>
        read[LoadGameCommandView](payload).map(v => GameCommand.LoadGame(v.fileName))

      case "SaveGame" =>
        Right(GameCommand.SaveGame)

      case "QuitGame" =>
        Right(GameCommand.QuitGame)

      case "GetState" =>
        Right(GameCommand.GetState)

      case "RegularAttack" | "SingleAttack" =>
        read[RegularAttackCommandView](payload).flatMap(toSingleAttack)

      case "DoubleAttack" =>
        read[DoubleAttackCommandView](payload).flatMap(toDoubleAttack)

      case "Boost" =>
        read[BoostCommandView](payload).flatMap(toBoost)

      case "RegularSwap" | "Swap" =>
        read[RegularSwapCommandView](payload).map(v => GameCommand.RegularSwap(v.index))

      case "ReverseSwap" =>
        Right(GameCommand.ReverseSwap)

      case "Undo" =>
        Right(GameCommand.Undo)

      case "Redo" =>
        Right(GameCommand.Redo)

      case "ExecuteAI" =>
        read[AIActionCommandView](payload).flatMap(toExecuteAI)

      case other =>
        Left(AppError(s"Unknown command type: $other"))
    }

  private def read[A: Reads](js: JsValue): Either[AppError, A] =
    js.validate[A] match {
      case JsSuccess(value, _) => Right(value)
      case JsError(errors)     => Left(AppError(JsError.toJson(errors).toString()))
    }

  private def validateDefenderIndex(i: Int): Either[AppError, Int] =
    if (DefenderIndexRange.contains(i)) Right(i)
    else Left(AppError(s"Defender index out of range: $i (expected ${DefenderIndexRange.start}..${DefenderIndexRange.end})"))

  private sealed trait AttackTarget
  private object AttackTarget {
    final case class DefenderAt(index: Int) extends AttackTarget
    case object Goalkeeper extends AttackTarget
  }

  private def toTarget(target: String, index: Option[Int]): Either[AppError, AttackTarget] =
    target.toLowerCase match {
      case "goalkeeper" =>
        Right(AttackTarget.Goalkeeper)

      case "defender" =>
        index match {
          case Some(i) => validateDefenderIndex(i).map(AttackTarget.DefenderAt.apply)
          case None    => Left(AppError("Missing 'index' for target=defender"))
        }

      case other =>
        Left(AppError(s"Unknown target: $other"))
    }

  private def toSingleAttack(v: RegularAttackCommandView): Either[AppError, GameCommand] =
    toTarget(v.target, v.index).map {
      case AttackTarget.Goalkeeper    => GameCommand.SingleAttack(-1)
      case AttackTarget.DefenderAt(i) => GameCommand.SingleAttack(i)
    }

  private def toDoubleAttack(v: DoubleAttackCommandView): Either[AppError, GameCommand] =
    v.target.toLowerCase match {
        case "goalkeeper" =>
        Right(GameCommand.DoubleAttack(-1))

        case "defender" =>
        validateDefenderIndex(v.index).map(i => GameCommand.DoubleAttack(i))

        case other =>
        Left(AppError(s"Unknown target: $other"))
    }


  private def toBoost(v: BoostCommandView): Either[AppError, GameCommand] =
    v.target.toLowerCase match {
      case "goalkeeper" =>
        Right(GameCommand.Boost(-1, goalkeeper = true))

      case "defender" =>
        v.index match {
          case Some(i) => validateDefenderIndex(i).map(valid => GameCommand.Boost(valid, goalkeeper = false))
          case None    => Left(AppError("Missing 'index' for target=defender"))
        }

      case other =>
        Left(AppError(s"Unknown target: $other"))
    }

  private def toExecuteAI(v: AIActionCommandView): Either[AppError, GameCommand] = {
    import app.models._

    def zoneOf(s: String): Either[AppError, Zone] =
      s.toLowerCase match {
        case "defender"   => Right(DefenderZone)
        case "goalkeeper" => Right(GoalkeeperZone)
        case _            => Left(AppError("Invalid 'zone' for AIAction kind=Boost (expected 'defender' or 'goalkeeper')"))
      }

    val aiActionE: Either[AppError, AIAction] =
      v.kind match {
        case "SingleAttack" =>
          v.defenderIndex
            .toRight(AppError("Missing 'defenderIndex' for AIAction kind=SingleAttack"))
            .map(SingleAttackAIAction.apply)

        case "DoubleAttack" =>
          v.defenderIndex
            .toRight(AppError("Missing 'defenderIndex' for AIAction kind=DoubleAttack"))
            .map(DoubleAttackAIAction.apply)

        case "RegularSwap" =>
          v.handIndex
            .toRight(AppError("Missing 'handIndex' for AIAction kind=RegularSwap"))
            .map(RegularSwapAIAction.apply)

        case "ReverseSwap" =>
          Right(ReverseSwapAIAction)

        case "Undo" =>
          Right(UndoAIAction)

        case "Redo" =>
          Right(RedoAIAction)

        case "NoOp" =>
          Right(NoOpAIAction)

        case "Boost" =>
          (v.handIndex, v.zone) match {
            case (Some(idx), Some(zs)) =>
              zoneOf(zs).map(z => BoostAIAction(idx, z))

            case (None, _) =>
              Left(AppError("Missing 'handIndex' for AIAction kind=Boost"))

            case (_, None) =>
              Left(AppError("Missing 'zone' for AIAction kind=Boost"))
          }

        case other =>
          Left(AppError(s"Unknown AI action kind: $other"))
      }

    aiActionE.map(GameCommand.ExecuteAI.apply)
  }
}
