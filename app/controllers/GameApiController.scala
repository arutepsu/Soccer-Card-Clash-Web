package controllers

import javax.inject._
import play.api.mvc._
import play.api.libs.EventSource
import play.api.http.ContentTypes
import akka.stream.scaladsl.Source
import scala.concurrent.{ExecutionContext}
import scala.concurrent.duration._
import services.{TuiAdapter, WebTui}
import play.api.libs.json._

@Singleton
class GameApiController @Inject()(
  cc: ControllerComponents,
  tui: TuiAdapter,
  webTui: WebTui
)(implicit ec: ExecutionContext) extends AbstractController(cc) {

  def state: Action[AnyContent] = Action.async {
    tui.render().map(txt => Ok(txt).as(TEXT))
  }

  def command: Action[play.api.libs.json.JsValue] =
    Action.async(parse.json) { req =>
      val cmd = (req.body \ "command").asOpt[String].getOrElse("")
      tui.execute(cmd).map(out => Ok(out).as(TEXT))
    }

  def newGame: Action[play.api.libs.json.JsValue] =
    Action.async(parse.json) { req =>
      val p1 = (req.body \ "p1").asOpt[String].getOrElse("Player 1")
      val p2 = (req.body \ "p2").asOpt[String].getOrElse("Player 2")
      tui.newGame(p1, p2).map(out => Ok(out).as(TEXT))
    }

  def newGameAI: Action[play.api.libs.json.JsValue] =
    Action.async(parse.json) { req =>
      val human = (req.body \ "human").asOpt[String].getOrElse("Human")
      val ai    = (req.body \ "ai").asOpt[String].getOrElse("Bot")
      tui.newGameWithAI(human, ai).map(out => Ok(out).as(TEXT))
    }

  private def ok(text: String) = Ok(text).as(TEXT)

  def attack(idx: Int)        = Action.async { tui.singleAttack(idx).map(ok) }
  def doubleAttack(idx: Int)  = Action.async { tui.doubleAttack(idx).map(ok) }

  def regularSwap(idx: Int)   = Action.async { tui.regularSwap(idx).map(ok) }
  def reverseSwap()           = Action.async { tui.reverseSwap().map(ok) }

  def boostDefender(idx: Int) = Action.async { tui.boostDefender(idx).map(ok) }
  def boostGoalkeeper()       = Action.async { tui.boostGoalkeeper().map(ok) }

  def undo()                  = Action.async { tui.undo().map(ok) }
  def redo()                  = Action.async { tui.redo().map(ok) }
  def save()                  = Action.async { tui.save().map(ok) }

  def showSaves()             = Action.async { tui.showSavedGames().map(ok) }
  def loadSelect(idx: Int)    = Action.async { tui.loadSelect(idx).map(ok) }

  def stream: Action[AnyContent] = Action {
    val src: Source[String, _] =
      Source.tick(0.millis, 200.millis, ())
        .map(_ => webTui.drain())     // send since-last-print
        .filter(_.nonEmpty)            // only emit when there’s something
    Ok.chunked(src.via(EventSource.flow)).as(ContentTypes.EVENT_STREAM)
  }

}