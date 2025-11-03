// app/controllers/TuiController.scala
package controllers

import javax.inject._
import play.api.mvc._
import play.api.libs.EventSource
import play.api.http.ContentTypes
import akka.stream.scaladsl.Source

import scala.concurrent.ExecutionContext
import scala.concurrent.duration._

import play.api.libs.json._
import play.api.i18n.Messages
import services.webtui._
import services.webtui.{WebTui, TuiAdapter}

@Singleton
class TuiController @Inject()(
  cc: MessagesControllerComponents,
  webTui: WebTui,
  tuiAdapter: TuiAdapter
) extends MessagesAbstractController(cc) {

  // Use Play's built-in execution context
  implicit private val ec: ExecutionContext = cc.executionContext

  /* ---------- Helpers ---------- */

  private def okText(s: String): Result =
    Ok(Json.obj("text" -> s)).as(JSON)

  // Sends the current WebTui state as JSON
  private def okJsonState: Result = {
    val snap = webTui.snapshot()
    Ok(Json.toJson(snap)).as(JSON)
  }

  /* ---------- TUI Web UI ---------- */

  def tui: Action[AnyContent] = Action { implicit req: MessagesRequest[AnyContent] =>
    implicit val m: Messages = messagesApi.preferred(req)
    webTui.bootOnce()
    Ok(views.html.tui("Soccer Card Clash - TUI", webTui.snapshot(), ""))
  }

  def submit: Action[AnyContent] = Action { implicit req: MessagesRequest[AnyContent] =>
    implicit val m: Messages = messagesApi.preferred(req)
    val cmd = req.body.asFormUrlEncoded.flatMap(_("command").headOption).getOrElse("")
    webTui.bootOnce()
    val out = webTui.runAndDrain { webTui.processInputLine(cmd) }
    Ok(views.html.tui("Soccer Card Clash - TUI", out, ""))
  }

  /* ---------- JSON Endpoints ---------- */

  def command: Action[JsValue] = Action.async(parse.json) { req =>
    val cmd = (req.body \ "command").asOpt[String].getOrElse("")
    tuiAdapter.execute(cmd).map(okText)
  }

  def newGame: Action[JsValue] = Action.async(parse.json) { req =>
    val p1 = (req.body \ "p1").asOpt[String].getOrElse("Player 1")
    val p2 = (req.body \ "p2").asOpt[String].getOrElse("Player 2")
    tuiAdapter.newGame(p1, p2).map(_ => okJsonState)
  }

  def newGameAI: Action[JsValue] = Action.async(parse.json) { req =>
    val human = (req.body \ "human").asOpt[String].getOrElse("Human")
    val ai    = (req.body \ "ai").asOpt[String].getOrElse("Bot")
    tuiAdapter.newGameWithAI(human, ai).map(_ => okJsonState)
  }

  /* ---------- Game Actions ---------- */

  def attack(idx: Int)        = Action.async { tuiAdapter.singleAttack(idx).map(_ => okJsonState) }
  def doubleAttack(idx: Int)  = Action.async { tuiAdapter.doubleAttack(idx).map(_ => okJsonState) }
  def regularSwap(idx: Int)   = Action.async { tuiAdapter.regularSwap(idx).map(_ => okJsonState) }
  def reverseSwap()           = Action.async { tuiAdapter.reverseSwap().map(_ => okJsonState) }
  def boostDefender(idx: Int) = Action.async { tuiAdapter.boostDefender(idx).map(_ => okJsonState) }
  def boostGoalkeeper()       = Action.async { tuiAdapter.boostGoalkeeper().map(_ => okJsonState) }
  def undo()                  = Action.async { tuiAdapter.undo().map(_ => okJsonState) }
  def redo()                  = Action.async { tuiAdapter.redo().map(_ => okJsonState) }
  def save()                  = Action.async { tuiAdapter.save().map(_ => okJsonState) }

  def showSaves()             = Action.async { tuiAdapter.showSavedGames().map(okText) }
  def loadSelect(idx: Int)    = Action.async { tuiAdapter.loadSelect(idx).map(_ => okJsonState) }
}