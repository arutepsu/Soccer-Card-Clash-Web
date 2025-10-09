package services

import scala.util.Try
import javax.inject._
import scala.concurrent.{ExecutionContext, Future}
import de.htwg.se.soccercardclash.controller.IController
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder

@Singleton
class TuiAdapter @Inject()(
  controller: IController,
  holder: IGameContextHolder,
  webTui: WebTui
)(implicit ec: ExecutionContext) {

  def render(): Future[String] = Future { webTui.snapshot() }
  
  private def hasCtx: Boolean = Try(holder.get).isSuccess

  private def snapAfter(body: => Any): String =
    if (hasCtx) { body; webTui.snapshot() } else webTui.snapshot()

  def execute(command: String): Future[String] = Future {
    val n = command.trim.toLowerCase
    // keep the server alive in web mode
    if (n == ":exit" || n == "exit" || n == ":quit" || n == "quit") {
      "Exit is disabled in the web version.\n" + webTui.snapshot()
    } else {
      webTui.processInputLine(command)
      webTui.snapshot()
    }
  }

  def newGame(p1: String, p2: String): Future[String] = Future {
    controller.createGame(p1, p2)
    webTui.snapshot()
  }

  def newGameWithAI(human: String, ai: String): Future[String] = Future {
    controller.createGameWithAI(human, ai)
    webTui.snapshot()
  }

   def singleAttack(defenderIndex: Int): Future[String] = Future {
    snapAfter { controller.singleAttack(defenderIndex, holder.get) }
  }

  def doubleAttack(defenderIndex: Int): Future[String] = Future {
    snapAfter { controller.doubleAttack(defenderIndex, holder.get) }
  }

  def regularSwap(handIndex: Int): Future[String] = Future {
    snapAfter { controller.regularSwap(handIndex, holder.get) }
  }

  def reverseSwap(): Future[String] = Future {
    snapAfter { controller.reverseSwap(holder.get) }
  }

  def boostDefender(defenderIndex: Int): Future[String] = Future {
    snapAfter { controller.boostDefender(defenderIndex, holder.get) }
  }

  def boostGoalkeeper(): Future[String] = Future {
    snapAfter { controller.boostGoalkeeper(holder.get) }
  }

  def undo(): Future[String] = Future {
    snapAfter { controller.undo(holder.get) }
  }

  def redo(): Future[String] = Future {
    snapAfter { controller.redo(holder.get) }
  }

  def save(): Future[String] = Future {
    // your controller fires GameActionEvent.SaveGame on success; TUI prints via Prompter
    snapAfter { controller.saveGame(holder.get) }
  }

  // === load helpers (mirror your TUI exactly) ===
  def showSavedGames(): Future[String] = Future {
    // Same as typing ":load" in your TUI
    webTui.processInputLine(":load")
    webTui.snapshot()
  }

  def loadSelect(index: Int): Future[String] = Future {
    // Same as typing "select <n>" (your TUI parses this with a regex)
    webTui.processInputLine(s"select $index")
    webTui.snapshot()
  }
}
