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
import app.models.WebGameState
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder
import app.mapping.ViewStateMapper
import app.api.IGameUseCases
import controllers.dto.SingleAttackDto

@Singleton
class GameApiController @Inject()(
  cc: ControllerComponents,
  ctxHolder: IGameContextHolder,
  gameUseCases: IGameUseCases
)(implicit ec: ExecutionContext) extends AbstractController(cc) {


  sealed trait AttackTarget
  object AttackTarget {
    final case class DefenderAt(index: Int) extends AttackTarget
    case object Goalkeeper extends AttackTarget
  }

  /* ---------- helpers ---------- */

  private def withSid(f: String => Result)(implicit req: RequestHeader): Result =
    req.session.get("sid").map(f).getOrElse(Unauthorized("No session id (sid) in cookie/session)"))

  private def toTarget(dto: SingleAttackDto): Either[String, AttackTarget] = {
    dto.target.toLowerCase match {
      case "goalkeeper" => Right(AttackTarget.Goalkeeper)
      case "defender" =>
        dto.index match {
          case Some(i) =>
            if (i >= 0 && i <= 2) Right(AttackTarget.DefenderAt(i))
            else Left(s"Defender index out of range: $i (expected 0..2)")
          case None =>
            Left("Missing 'index' for target=defender")
        }
      case other =>
        Left(s"Unknown target: $other")
    }
  }



  /* ---------- endpoints ---------- */

  def state: Action[AnyContent] = Action { implicit req =>
    withSid { sid =>
      gameUseCases.state(sid) match {
        case Right(web) => Ok(Json.toJson(web)).as(JSON)
        case Left(err)  => NotFound(Json.obj("error" -> err.message))
      }
    }
  }

  def stream: Action[AnyContent] = Action { implicit req =>
    withSid { sid =>
      val src =
        Source.tick(0.seconds, 200.millis, ())
          .map(_ => gameUseCases.state(sid))
          .collect { case Right(web) => web }
          .map(web => Json.stringify(Json.toJson(web)))

      Ok.chunked(src.via(EventSource.flow)).as(ContentTypes.EVENT_STREAM)
    }
  }

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
              case Right(web) => Ok(Json.toJson(web)).as(JSON)
              case Left(err)  => BadRequest(Json.obj("error" -> err.message))
            }
          case Right(AttackTarget.DefenderAt(i)) =>
            gameUseCases.singleAttack(i, sid) match {
              case Right(web) => Ok(Json.toJson(web)).as(JSON)
              case Left(err)  => BadRequest(Json.obj("error" -> err.message))
            }
        }
      )
    }
  }
}
