package modules

import com.google.inject.AbstractModule

// If you have a module in the SE project, import it:
import de.htwg.se.soccercardclash.module.SoccerCardClashModule
import de.htwg.se.soccercardclash.view.tui.Tui
import services.TuiAdapter
import services.WebTui

class Module extends AbstractModule {
  override def configure(): Unit = {
    install(new SoccerCardClashModule) // provides IController, IGameContextHolder, etc.
    bind(classOf[TuiAdapter]).asEagerSingleton()
    bind(classOf[Tui]).to(classOf[WebTui]).asEagerSingleton()
  }
}
