package app.api
import app.models.AppError
import app.models.state.WebGameState 
import de.htwg.se.soccercardclash.util.AIAction
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder
import app.session.GameSessionId

trait IGameUseCases {
  def createGame(p1: String, p2: String, sid: GameSessionId): Either[AppError, WebGameState]
  def createGameWithAI(humanPlayer: String, aiName: String, sid: GameSessionId): Either[AppError, WebGameState]
  def load(fileName: String, sid: GameSessionId): Either[AppError, WebGameState]
  def save(sid: GameSessionId): Either[AppError, WebGameState]
  def quit(): Either[AppError, Unit]

  def state(sid: GameSessionId): Either[AppError, WebGameState]

  def swap(index: Int, sid: GameSessionId): Either[AppError, WebGameState]
  def reverseSwap(sid: GameSessionId): Either[AppError, WebGameState]
  def boost(defenderIndex: Int, sid: GameSessionId, goalkeeper: Boolean): Either[AppError, WebGameState]
  def doubleAttack(defenderIndex: Int, sid: GameSessionId): Either[AppError, WebGameState]
  def singleAttack(defenderIndex: Int, sid: GameSessionId): Either[AppError, WebGameState]

  def undo(sid: GameSessionId): Either[AppError, WebGameState]
  def redo(sid: GameSessionId): Either[AppError, WebGameState]

  def executeAI(action: AIAction, sid: GameSessionId): Either[AppError, WebGameState]

  def holder: IGameContextHolder
}
