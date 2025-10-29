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

@Singleton
class GameApiController @Inject()(
  cc: ControllerComponents,
  tui: TuiAdapter,
  webTui: WebTui,
  ctxHolder: IGameContextHolder
)(implicit ec: ExecutionContext) extends AbstractController(cc) {

  /** ---- helpers ---- */
  private def currentWebState(): WebGameState =
    ViewStateMapper.toWebState(ctxHolder.get)

  private def okJsonState = Ok(Json.toJson(currentWebState())).as(JSON)

  private def okText(text: String) = Ok(text).as(TEXT)

  /** ---- JSON: current structured state for the UI ---- */
  def state: Action[AnyContent] = Action {
    okJsonState
  }

  /** ---- TUI: text endpoints (kept) ---- */
  def command: Action[JsValue] = Action.async(parse.json) { req =>
    val cmd = (req.body \ "command").asOpt[String].getOrElse("")
    tui.execute(cmd).map(okText)
  }

  def newGame: Action[JsValue] = Action.async(parse.json) { req =>
    val p1 = (req.body \ "p1").asOpt[String].getOrElse("Player 1")
    val p2 = (req.body \ "p2").asOpt[String].getOrElse("Player 2")
    tui.newGame(p1, p2).map(_ => okJsonState) // return fresh JSON state for UI
  }

  def newGameAI: Action[JsValue] = Action.async(parse.json) { req =>
    val human = (req.body \ "human").asOpt[String].getOrElse("Human")
    val ai    = (req.body \ "ai").asOpt[String].getOrElse("Bot")
    tui.newGameWithAI(human, ai).map(_ => okJsonState)
  }

  /** ---- Game actions: return updated JSON state so UI can refresh ---- */
  def attack(idx: Int)        = Action.async { tui.singleAttack(idx).map(_ => okJsonState) }
  def doubleAttack(idx: Int)  = Action.async { tui.doubleAttack(idx).map(_ => okJsonState) }

  def regularSwap(idx: Int)   = Action.async { tui.regularSwap(idx).map(_ => okJsonState) }
  def reverseSwap()           = Action.async { tui.reverseSwap().map(_ => okJsonState) }

  def boostDefender(idx: Int) = Action.async { tui.boostDefender(idx).map(_ => okJsonState) }
  def boostGoalkeeper()       = Action.async { tui.boostGoalkeeper().map(_ => okJsonState) }

  def undo()                  = Action.async { tui.undo().map(_ => okJsonState) }
  def redo()                  = Action.async { tui.redo().map(_ => okJsonState) }
  def save()                  = Action.async { tui.save().map(_ => okJsonState) }

  def showSaves()             = Action.async { tui.showSavedGames().map(okText) }
  def loadSelect(idx: Int)    = Action.async { tui.loadSelect(idx).map(_ => okJsonState) }

  /** ---- SSE stream: push JSON diffs or full state ----
    * If your WebTui only yields text, you can ignore this or send text events.
    * Here we push the full state on a timer; you can replace with change-driven logic.
    */
  def stream: Action[AnyContent] = Action {
    val src: Source[String, _] =
      Source.tick(0.millis, 200.millis, ())
        .map(_ => Json.stringify(Json.toJson(currentWebState())))
    Ok.chunked(src.via(EventSource.flow)).as(ContentTypes.EVENT_STREAM)
  }
}