package modules

import com.google.inject.AbstractModule
import de.htwg.se.soccercardclash.module.SoccerCardClashModule
import app.api.usecases.IGameUseCases
import app.api.usecases.GameUseCases
import app.session.repositories._
import app.api.context.{ IGameContextRepository, GameContextRepository }
import app.session._
import app.fileIO.IFileIO
import app.fileIO.JsonFileIO
import app.session.IGameSessionService
import app.session.GameSessionService
import app.mapping.IViewStateMapper
import app.mapping.ViewStateMapper
import app.api.context._
import app.controllers.stream.{IGameStreamController, GameStreamController}
import app.controllers.ws.{IGameWsController, GameWsController}
import app.controllers.command._
import app.controllers.session._
import app.api.command.{IGameCommandFacade, GameCommandFacade, GameCommandDecoder}
import app.api.ai.{IAiDecisionService, DomainAiDecisionService}

final class Module extends AbstractModule {
  override def configure(): Unit = {
    install(new SoccerCardClashModule)

    bind(classOf[IGameUseCases]).to(classOf[GameUseCases]).asEagerSingleton()
    bind(classOf[IGameContextRepository])
      .to(classOf[GameContextRepository])
      .asEagerSingleton()
    bind(classOf[IGameSessionRepository]).to(classOf[InMemoryGameSessionRepository]).asEagerSingleton()
    bind(classOf[IFileIO]).to(classOf[JsonFileIO]).asEagerSingleton()

    bind(classOf[IGameSessionService]).to(classOf[GameSessionService]).asEagerSingleton()
    bind(classOf[IViewStateMapper]).to(classOf[ViewStateMapper]).asEagerSingleton()

    bind(classOf[IGameCommandFacade]).to(classOf[GameCommandFacade]).asEagerSingleton()
    bind(classOf[GameCommandDecoder]).asEagerSingleton()

    bind(classOf[IGameWsController]).to(classOf[GameWsController])
    bind(classOf[IGameStreamController]).to(classOf[GameStreamController])
    bind(classOf[IGameCommandController]).to(classOf[GameCommandController])
    bind(classOf[ISessionController]).to(classOf[SessionController])
    bind(classOf[IAiDecisionService]).to(classOf[DomainAiDecisionService])
  }
}
