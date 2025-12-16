package app.api.command

sealed trait GameCommand

object GameCommand {
  case class SingleAttack(index: Int) extends GameCommand
  case class DoubleAttack(index: Int) extends GameCommand
  case class Boost(index: Int, goalkeeper: Boolean) extends GameCommand
  case class RegularSwap(index: Int) extends GameCommand
  case object ReverseSwap extends GameCommand
  case object Undo extends GameCommand
  case object Redo extends GameCommand
  case class ExecuteAI(action: de.htwg.se.soccercardclash.util.AIAction) extends GameCommand
  case class CreateGame(p1: String, p2: String) extends GameCommand
  case class CreateGameWithAI(human: String, aiName: String) extends GameCommand
  case class LoadGame(fileName: String) extends GameCommand
  case object SaveGame extends GameCommand
  case object QuitGame extends GameCommand
  case object GetState extends GameCommand
}
