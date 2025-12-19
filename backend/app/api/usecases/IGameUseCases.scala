package app.api.usecases

import app.models.AppError
import app.models.state.WebGameState 
import de.htwg.se.soccercardclash.util.AIAction
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder
import app.session.GameSessionId
import app.auth.AuthPrincipal
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext

trait IGameUseCases {
  def createGame(p1: String, p2: String, sid: GameSessionId, principal: Option[AuthPrincipal]): Either[AppError, WebGameState]
  def createGameWithAI(humanPlayer: String, aiName: String, sid: GameSessionId, principal: Option[AuthPrincipal]): Either[AppError, WebGameState]
  def load(fileName: String, sid: GameSessionId, principal: Option[AuthPrincipal]): Either[AppError, WebGameState]
  def save(sid: GameSessionId, principal: Option[AuthPrincipal]): Either[AppError, WebGameState]

  def state(sid: GameSessionId, principal: Option[AuthPrincipal]): Either[AppError, WebGameState]

  def singleAttack(defenderIndex: Int, sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState]
  def doubleAttack(defenderIndex: Int, sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState]

  def boost(defenderIndex: Int, sid: GameSessionId, goalkeeper: Boolean, principal: AuthPrincipal): Either[AppError, WebGameState]

  def swap(index: Int, sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState]
  def reverseSwap(sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState]

  def undo(sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState]
  def redo(sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState]

  def executeAI(action: AIAction, sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState]

  def quit(): Either[AppError, Unit]

  def getCtx(sid: GameSessionId): Option[GameContext]
}

