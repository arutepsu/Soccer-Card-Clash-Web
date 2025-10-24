// app/webscene/WebSceneFactory.scala
package services.webscene

import javax.inject.*
import de.htwg.se.soccercardclash.util.SceneSwitchEvent

@Singleton
class WebSceneFactory @Inject()(
  mainMenu: MainMenuWebScene,
  multi: CreateMultiplayerWebScene,
  single: CreateSinglePlayerWebScene,
  aiSel: AISelectionWebScene,
  load: LoadGameWebScene,
  field: PlayingFieldWebScene,
  attackerHand: AttackerHandWebScene,
  attackerDef: AttackerDefendersWebScene
) {
  def create(e: SceneSwitchEvent): WebScene = e match {
    case SceneSwitchEvent.MainMenu              => mainMenu
    case SceneSwitchEvent.Multiplayer           => multi
    case SceneSwitchEvent.SinglePlayer          => single
    case SceneSwitchEvent.AISelection           => aiSel
    case SceneSwitchEvent.LoadGame              => load
    case SceneSwitchEvent.PlayingField          => field
    case SceneSwitchEvent.AttackerHandCards     => attackerHand
    case SceneSwitchEvent.AttackerDefenderCards => attackerDef
  }
}
