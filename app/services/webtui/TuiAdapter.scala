package services.webtui

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

  def render(): Future[String] = Future {
    webTui.drain()
  }
  
  private def hasCtx: Boolean = Try(holder.get).isSuccess

  private def drainAfter(body: => Any): String =
    if (hasCtx) { body; webTui.drain()  } else webTui.drain() 
  def execute(command: String): Future[String] = Future {
    val n = command.trim.toLowerCase
    if (Set(":exit","exit",":quit","quit").contains(n)) {
      "Exit is disabled in the web version.\n" + webTui.drain()
    } else {
      webTui.processInputLine(command)
      webTui.drain()
    }
  }

  def newGame(p1: String, p2: String): Future[String] = Future {
    controller.createGame(p1, p2)
    webTui.drain() 
  }

  def newGameWithAI(human: String, ai: String): Future[String] = Future {
    controller.createGameWithAI(human, ai)
    webTui.drain() 
  }

   def singleAttack(defenderIndex: Int): Future[String] = Future {
    drainAfter { controller.singleAttack(defenderIndex, holder.get) }
  }

  def doubleAttack(defenderIndex: Int): Future[String] = Future {
    drainAfter { controller.doubleAttack(defenderIndex, holder.get) }
  }

  def regularSwap(handIndex: Int): Future[String] = Future {
    drainAfter { controller.regularSwap(handIndex, holder.get) }
  }

  def reverseSwap(): Future[String] = Future {
    drainAfter { controller.reverseSwap(holder.get) }
  }

  def boostDefender(defenderIndex: Int): Future[String] = Future {
    drainAfter { controller.boostDefender(defenderIndex, holder.get) }
  }

  def boostGoalkeeper(): Future[String] = Future {
    drainAfter { controller.boostGoalkeeper(holder.get) }
  }

  def undo(): Future[String] = Future {
    drainAfter { controller.undo(holder.get) }
  }

  def redo(): Future[String] = Future {
    drainAfter { controller.redo(holder.get) }
  }

  def save(): Future[String] = Future {
    drainAfter { controller.saveGame(holder.get) }
  }

  def showSavedGames(): Future[String] = Future {
    webTui.processInputLine(":load")
     webTui.drain() 
  }

  def loadSelect(index: Int): Future[String] = Future {
    webTui.processInputLine(s"select $index")
    webTui.drain() 
  }
}