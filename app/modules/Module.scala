package modules

import com.google.inject.AbstractModule

// If you have a module in the SE project, import it:
import de.htwg.se.soccercardclash.module.SoccerCardClashModule
import de.htwg.se.soccercardclash.view.tui.Tui
import services.webtui.TuiAdapter
import services.webtui.WebTui
import app.api.IGameUseCases
import app.api.GameUseCases
import app.repositories.GameContextRepository
import app.repositories.InMemoryGameContextRepository
import app.fileIO.IFileIO
import app.fileIO.JsonFileIO
import app.services.IGamePushService
import app.services.GamePushService

class Module extends AbstractModule {
  override def configure(): Unit = {
    install(new SoccerCardClashModule)
    bind(classOf[TuiAdapter]).asEagerSingleton()
    bind(classOf[Tui]).to(classOf[WebTui]).asEagerSingleton()
    bind(classOf[IGameUseCases]).to(classOf[GameUseCases]).asEagerSingleton()
    bind(classOf[GameContextRepository]).to(classOf[InMemoryGameContextRepository]).asEagerSingleton()
    bind(classOf[IFileIO]).to(classOf[JsonFileIO]).asEagerSingleton()
    bind(classOf[IGamePushService]).to(classOf[GamePushService]).asEagerSingleton()
  }
}
