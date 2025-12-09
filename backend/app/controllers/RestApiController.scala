package controllers

import javax.inject._
import play.api.mvc._
import play.api.libs.EventSource
import play.api.http.ContentTypes
import akka.stream.scaladsl.Source
import scala.concurrent.{ExecutionContext}
import scala.concurrent.duration._
import services.webtui._
import play.api.libs.json._
import app.models.state.WebGameState
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder
import app.mapping.ViewStateMapper
import app.api.IGameUseCases
import controllers.dto._
import de.htwg.se.soccercardclash.util.AIAction
import controller.json.AIActionJson._
import controllers.dto.LocalMultiplayerDto
import app.api.IGameUseCases
import app.session.GameSessionId
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder
import controllers.dto._
import de.htwg.se.soccercardclash.util.AIAction
import app.api.services.GameEventHub
import scala.util.Try
import app.models.state.WebGameState
import app.models.AppError
final case class GameRestartDto(
    attackerName: Option[String],
    defenderName: Option[String],
)
object GameRestartDto {
    implicit val reads: Reads[GameRestartDto] = Json.reads[GameRestartDto]
}

@Singleton
class GameApiController @Inject()(
  cc: ControllerComponents,
  ctxHolder: IGameContextHolder,
  gameUseCases: IGameUseCases,
  eventHub: GameEventHub,
)(implicit ec: ExecutionContext)
  extends AbstractController(cc) {


  private val JSON = "application/json"

  sealed trait AttackTarget
  object AttackTarget {
    final case class DefenderAt(index: Int) extends AttackTarget
    case object Goalkeeper extends AttackTarget
  }

  private def getOrCreateSid(req: RequestHeader): GameSessionId =
    req.session.get("sid") match {
      case Some(raw) => GameSessionId(raw)
      case None      => GameSessionId(java.util.UUID.randomUUID().toString)
    }

  private def withSid(f: GameSessionId => Result)(implicit req: RequestHeader): Result =
    req.session.get("sid") match {
      case Some(raw) => f(GameSessionId(raw))
      case None      => Unauthorized("No session id (sid) in cookie/session")
    }

  private def toTarget(dto: SingleAttackDto): Either[String, AttackTarget] =
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

  def state: Action[AnyContent] = Action { implicit req =>
    withSid { sid =>
      gameUseCases.state(sid) match {
        case Right(web) =>
          eventHub.publish(sid, web)
          Ok(Json.toJson(web)).as(JSON)
        case Left(err)  => NotFound(Json.obj("error" -> err.message))
      }
    }
  }


  // def stream: Action[AnyContent] = Action { implicit req =>
  //   withSid { sid =>
  //     val src = Source
  //       .tick(0.seconds, 200.millis, ())
  //       .map(_ => gameUseCases.state(sid))
  //       .collect { case Right(web) => web }
  //       .map(web => Json.stringify(Json.toJson(web)))

  //     Ok.chunked(src.via(EventSource.flow)).as(ContentTypes.EVENT_STREAM)
  //   }
  // }

  /** Single attack via JSON:
    * { "target": "goalkeeper" }  -> GK attack
    * { "target": "defender", "index": 0 } -> defender@0
    */
  def singleAttack: Action[JsValue] = Action(parse.json) { implicit req =>
    withSid { sid =>
      req.body.validate[SingleAttackDto].fold(
        bad => BadRequest(Json.obj("error" -> JsError.toJson(bad))),
        dto => toTarget(dto) match {
          case Left(msg) => BadRequest(Json.obj("error" -> msg))

          case Right(AttackTarget.Goalkeeper) =>
            gameUseCases.singleAttack(-1, sid) match {
              case Right(web) =>
                eventHub.publish(sid, web)      // <-- NEW
                Ok(Json.toJson(web)).as(JSON)
              case Left(err)  =>
                BadRequest(Json.obj("error" -> err.message))
            }

          case Right(AttackTarget.DefenderAt(i)) =>
            gameUseCases.singleAttack(i, sid) match {
              case Right(web) =>
                eventHub.publish(sid, web)      // <-- NEW
                Ok(Json.toJson(web)).as(JSON)
              case Left(err)  =>
                BadRequest(Json.obj("error" -> err.message))
            }
        }
      )
    }
  }


  /** Boost defender or goalkeeper.
    * { "target": "goalkeeper" } or { "target": "defender", "index": 1 }
    */
  def boost: Action[JsValue] = Action(parse.json) { implicit req =>
    withSid { sid =>
      req.body.validate[BoostDto].fold(
        bad => BadRequest(Json.obj("error" -> JsError.toJson(bad))),
        dto => dto.target.toLowerCase match {
          case "goalkeeper" =>
            gameUseCases.boost(-1, sid, goalkeeper = true) match {
              case Right(web) =>
                 eventHub.publish(sid, web)
                 Ok(Json.toJson(web)).as(JSON)
              case Left(err)  => BadRequest(Json.obj("error" -> err.message))
            }

          case "defender" =>
            dto.index match {
              case Some(i) if i >= 0 && i <= 2 =>
                gameUseCases.boost(i, sid, goalkeeper = false) match {
                  case Right(web) =>
                    eventHub.publish(sid, web)
                    Ok(Json.toJson(web)).as(JSON)

                  case Left(err)  => BadRequest(Json.obj("error" -> err.message))
                }

              case Some(i) =>
                BadRequest(Json.obj("error" -> s"Defender index out of range: $i (expected 0..2)"))

              case None =>
                BadRequest(Json.obj("error" -> "Missing 'index' for target=defender"))
            }

          case other =>
            BadRequest(Json.obj("error" -> s"Unknown target: $other"))
        }
      )
    }
  }

  /** Double attack (vs defender@i). */
  def doubleAttack: Action[JsValue] = Action(parse.json) { implicit req =>
    withSid { sid =>
      req.body.validate[DoubleAttackDto].fold(
        bad => BadRequest(Json.obj("error" -> JsError.toJson(bad))),
        dto =>
          if (dto.index >= 0 && dto.index <= 2) {
            gameUseCases.doubleAttack(dto.index, sid) match {
              case Right(web) =>
              eventHub.publish(sid, web)
              Ok(Json.toJson(web)).as(JSON)
              case Left(err)  => BadRequest(Json.obj("error" -> err.message))
            }
          } else {
            BadRequest(Json.obj(
              "error" -> s"Defender index out of range: ${dto.index} (expected 0..2)"
            ))
          }
      )
    }
  }

  /** Swap attacker hand card by index. */
  def swap: Action[JsValue] = Action(parse.json) { implicit req =>
    withSid { sid =>
      req.body.validate[SwapDto].fold(
        bad => BadRequest(Json.obj("error" -> JsError.toJson(bad))),
        dto => gameUseCases.swap(dto.index, sid) match {
          case Right(web) =>
          eventHub.publish(sid, web) 
          Ok(Json.toJson(web)).as(JSON)
          case Left(err)  => BadRequest(Json.obj("error" -> err.message))
        }
      )
    }
  }

  /** Reverse swap. */
  def reverseSwap: Action[AnyContent] = Action { implicit req =>
    withSid { sid =>
      gameUseCases.reverseSwap(sid) match {
        case Right(web) =>
        eventHub.publish(sid, web)
        Ok(Json.toJson(web)).as(JSON)
        case Left(err)  => BadRequest(Json.obj("error" -> err.message))
      }
    }
  }

  /** Undo last move. */
  def undo: Action[AnyContent] = Action { implicit req =>
    withSid { sid =>
      gameUseCases.undo(sid) match {
        case Right(web) =>
        eventHub.publish(sid, web)
        Ok(Json.toJson(web)).as(JSON)
        case Left(err)  => BadRequest(Json.obj("error" -> err.message))
      }
    }
  }

  /** Redo previously undone move. */
  def redo: Action[AnyContent] = Action { implicit req =>
    withSid { sid =>
      gameUseCases.redo(sid) match {
        case Right(web) =>
        eventHub.publish(sid, web)
        Ok(Json.toJson(web)).as(JSON)
        case Left(err)  => BadRequest(Json.obj("error" -> err.message))
      }
    }
  }

  def executeAI: Action[JsValue] = Action(parse.json) { implicit req =>
    withSid { sid =>
      req.body.validate[AIAction].fold(
        bad => BadRequest(Json.obj("error" -> JsError.toJson(bad))),
        action => gameUseCases.executeAI(action, sid) match {
          case Right(web) =>
          eventHub.publish(sid, web)
          Ok(Json.toJson(web)).as(JSON)
          case Left(err)  => BadRequest(Json.obj("error" -> err.message))
        }
      )
    }
  }
    // 🔹 NEW: restart endpoint for SPA
  /** Restart / create a new game for the current session.
    *
    * JSON body: { "attackerName": "...", "defenderName": "..." } (both optional)
    * Falls back to previous game names, then "Player 1"/"Player 2".
    * Returns a plain WebGameState and sets/keeps the `sid` cookie.
    */
  def restart: Action[JsValue] = Action(parse.json) { implicit req =>
    // 1) read optional names from JSON
    val bodyDto: Option[GameRestartDto] =
      req.body.validate[GameRestartDto].asOpt

    val bodyNames: Option[(String, String)] = for {
      dto  <- bodyDto
      att  <- dto.attackerName.filter(_.nonEmpty)
      defn <- dto.defenderName.filter(_.nonEmpty)
    } yield (att, defn)

    // 2) or reuse names from previous context, if any
    val prevNames: Option[(String, String)] =
      Try {
        val ctx = gameUseCases.holder.get
        (ctx.state.getRoles.attacker.name, ctx.state.getRoles.defender.name)
      }.toOption

    // 3) otherwise defaults
    val (attackerName, defenderName) =
      bodyNames.orElse(prevNames).getOrElse(("Player 1", "Player 2"))

    // 4) clear previous context
    gameUseCases.holder.clear()

    // 5) get or create sid and create game
    val sid = getOrCreateSid(req)

    val createdWeb: Either[AppError, WebGameState] =
      gameUseCases.createGame(attackerName, defenderName, sid)

    createdWeb.fold(
      err =>
        InternalServerError(Json.obj("error" -> err.message)),

      web => {
        eventHub.publish(sid, web)
        Ok(Json.toJson(web))
          .as(JSON)
          .addingToSession("sid" -> sid.value)
      }
    )
  }
  // in GameApiController
  def createLocalMultiplayer: Action[JsValue] = Action(parse.json) { implicit req =>
    // ensure we have a sid bound to this browser
    val sid = getOrCreateSid(req)

    req.body.validate[LocalMultiplayerDto].fold(
      bad => BadRequest(Json.obj("error" -> JsError.toJson(bad))),
      dto => {
        gameUseCases.createGame(dto.attackerName, dto.defenderName, sid) match {
          case Right(web) =>
            // push initial state to SSE/WS subscribers
            eventHub.publish(sid, web)

            Ok(Json.toJson(web))
              .as(JSON)
              .addingToSession("sid" -> sid.value)  // 🔑 set sid cookie

          case Left(err) =>
            BadRequest(Json.obj("error" -> err.message))
        }
      }
    )
  }

}