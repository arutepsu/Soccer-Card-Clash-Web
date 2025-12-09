package app.fileIO

import de.htwg.se.soccercardclash.model.gameComponent.IGameState

trait IFileIO {
  def load(fileName: String): Option[IGameState]
  def save(gameState: IGameState, fileName: String): Unit
}
