package modules

import com.google.inject.AbstractModule
import de.htwg.se.soccercardclash.module.SoccerCardClashModule
import de.htwg.se.soccercardclash.view.tui.Tui
import services.webtui.TuiAdapter
import services.webtui.WebTui
import app.api.IGameUseCases
import app.api.GameUseCases
import app.session.repositories._
import app.fileIO.IFileIO
import app.fileIO.JsonFileIO
import app.api.push.IGamePushService
import app.api.push.GamePushService
import app.session.IGameSessionService
import app.session.GameSessionService
import app.mapping.IViewStateMapper
import app.mapping.ViewStateMapper

class Module extends AbstractModule {
  override def configure(): Unit = {
    install(new SoccerCardClashModule)
    bind(classOf[TuiAdapter]).asEagerSingleton()
    bind(classOf[Tui]).to(classOf[WebTui]).asEagerSingleton()
    bind(classOf[IGameUseCases]).to(classOf[GameUseCases]).asEagerSingleton()
    bind(classOf[IGameContextRepository]).to(classOf[GameContextRepository]).asEagerSingleton()
    bind(classOf[IGameSessionRepository]).to(classOf[InMemoryGameSessionRepository]).asEagerSingleton()
    bind(classOf[IFileIO]).to(classOf[JsonFileIO]).asEagerSingleton()
    bind(classOf[IGamePushService]).to(classOf[GamePushService]).asEagerSingleton()
    bind(classOf[IGameSessionService]).to(classOf[GameSessionService]).asEagerSingleton()
    bind(classOf[IViewStateMapper]).to(classOf[ViewStateMapper]).asEagerSingleton()
  }
}
