// app/webscene/WebSceneFactory.scala
package services.webscene
import javax.inject._
import de.htwg.se.soccercardclash.util.SceneSwitchEvent
import play.api.Logger

@Singleton
class WebSceneFactory @Inject()(
  mainMenuProvider: Provider[MainMenuWebScene],
  multiProvider: Provider[CreateMultiplayerWebScene],
  singleProvider: Provider[CreateSinglePlayerWebScene],
  aiSelProvider: Provider[AISelectionWebScene],
  loadProvider: Provider[LoadGameWebScene],
  fieldProvider: Provider[PlayingFieldWebScene],
  attackerHandProvider: Provider[AttackerHandWebScene],
  attackerDefProvider: Provider[AttackerDefendersWebScene]
) {
  private val log = Logger(this.getClass)

  def create(e: SceneSwitchEvent): WebScene = e match {
    case SceneSwitchEvent.MainMenu              => mainMenuProvider.get()
    case SceneSwitchEvent.Multiplayer           => multiProvider.get()
    case SceneSwitchEvent.SinglePlayer          => singleProvider.get()
    case SceneSwitchEvent.AISelection           => aiSelProvider.get()
    case SceneSwitchEvent.LoadGame              => loadProvider.get()
    case SceneSwitchEvent.PlayingField          => fieldProvider.get()
    case SceneSwitchEvent.AttackerHandCards     => attackerHandProvider.get()
    case SceneSwitchEvent.AttackerDefenderCards => attackerDefProvider.get()

    // add the missing cases:
    case SceneSwitchEvent.Exit                  => mainMenuProvider.get()   // or a dedicated Exit scene if you have one
    case SceneSwitchEvent.StartGame             => fieldProvider.get()      // or wherever you want to land post-start

    // optional catch-all to stay future-proof:
    case other =>
      log.warn(s"Unmapped SceneSwitchEvent: $other, falling back to MainMenu")
      mainMenuProvider.get()
  }
}
