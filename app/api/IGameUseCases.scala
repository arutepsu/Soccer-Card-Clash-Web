package app.api
import app.models.AppError
import app.models.WebGameState 

trait IGameUseCases {
  def createMultiplayer(p1: String, p2: String, sid: String): Either[AppError, WebGameState]
  def state(sid: String): Either[AppError, WebGameState]
  def swap(index: Int, sid: String): Either[AppError, WebGameState]
  def boost(defenderIndex: Int, sid: String, goalkeeper: Boolean): Either[AppError, WebGameState]
  def doubleAttack(defenderIndex: Int, sid: String): Either[AppError, WebGameState]
  def singleAttack(defenderIndex: Int, sid: String): Either[AppError, WebGameState]
  def undo(sid: String): Either[AppError, WebGameState]
  def redo(sid: String): Either[AppError, WebGameState]
}