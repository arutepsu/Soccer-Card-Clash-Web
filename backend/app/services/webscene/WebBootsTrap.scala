package services.webscene
import javax.inject.*
import services.WebSceneManager
import de.htwg.se.soccercardclash.util.*
@Singleton
class WebBootstrap @Inject()(mgr: WebSceneManager) {
  GlobalObservable.notifyObservers(SceneSwitchEvent.MainMenu)
}
