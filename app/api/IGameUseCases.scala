package app.api
import app.models.AppError
import app.models.WebGameState 
import de.htwg.se.soccercardclash.util.AIAction
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder

trait IGameUseCases {
  def createGame(p1: String, p2: String, sid: String): Either[AppError, WebGameState]
  def createGameWithAI(humanPlayer: String, aiName: String, sid: String): Either[AppError, WebGameState]
  def load(fileName: String, sid: String): Either[AppError, WebGameState]
  def save(sid: String): Either[AppError, WebGameState]
  def quit(): Either[AppError, Unit]

  def state(sid: String): Either[AppError, WebGameState]

  def swap(index: Int, sid: String): Either[AppError, WebGameState]
  def reverseSwap(sid: String): Either[AppError, WebGameState]
  def boost(defenderIndex: Int, sid: String, goalkeeper: Boolean): Either[AppError, WebGameState]
  def doubleAttack(defenderIndex: Int, sid: String): Either[AppError, WebGameState]
  def singleAttack(defenderIndex: Int, sid: String): Either[AppError, WebGameState]

  def undo(sid: String): Either[AppError, WebGameState]
  def redo(sid: String): Either[AppError, WebGameState]

  def executeAI(action: AIAction, sid: String): Either[AppError, WebGameState]
  def holder: IGameContextHolder
}
