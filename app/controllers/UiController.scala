package controllers

import javax.inject.*
import play.api.mvc.*
import play.api.i18n.Messages
import services.WebSceneManager
import de.htwg.se.soccercardclash.util.*
import app.api.IGameUseCases
import java.util.UUID

@Singleton
class UiController @Inject()(
  cc: MessagesControllerComponents,
  mgr: WebSceneManager,
  gameUseCases: IGameUseCases            // <-- inject your use cases
) extends MessagesAbstractController(cc) {

  private val slugToEvent: Map[String, SceneSwitchEvent] = Map(
    "MainMenu"              -> SceneSwitchEvent.MainMenu,
    "Multiplayer"           -> SceneSwitchEvent.Multiplayer,
    "SinglePlayer"          -> SceneSwitchEvent.SinglePlayer,
    "AISelection"           -> SceneSwitchEvent.AISelection,
    "LoadGame"              -> SceneSwitchEvent.LoadGame,
    "PlayingField"          -> SceneSwitchEvent.PlayingField,
    "AttackerHandCards"     -> SceneSwitchEvent.AttackerHandCards,
    "AttackerDefenderCards" -> SceneSwitchEvent.AttackerDefenderCards
  )

  private val prettyToInternal: Map[String, String] = Map(
    "main-menu"          -> "MainMenu",
    "singleplayer"       -> "SinglePlayer",
    "multiplayer"        -> "Multiplayer",
    "ai"                 -> "AISelection",
    "load-game"          -> "LoadGame",
    "playing-field"      -> "PlayingField",
    "attacker-hand"      -> "AttackerHandCards",
    "attacker-defenders" -> "AttackerDefenderCards"
  )

  private def getOrCreateSid(req: RequestHeader): String =
    req.session.get("sid").getOrElse(UUID.randomUUID().toString)

  def scene(to: String): Action[AnyContent] = Action { implicit req: MessagesRequest[AnyContent] =>
    implicit val m: Messages = messagesApi.preferred(req)
    val internal = prettyToInternal.getOrElse(to, to)
    slugToEvent.get(internal) match {
      case Some(ev) =>
        GlobalObservable.notifyObservers(ev)
        Ok(views.html.scenes.gamepage(internal, mgr.sceneHtml))
      case None =>
        NotFound(s"Unknown scene: $to")
    }
  }

  def switchScene(to: String): Action[AnyContent] = Action { implicit req =>
    val internal = prettyToInternal.getOrElse(to, to)
    val pretty = prettyToInternal.find(_._2 == internal).map(_._1).getOrElse(internal)
    SeeOther(routes.UiController.scene(pretty).url)
  }

  def sceneCurrent(): Action[AnyContent] = Action { implicit req: MessagesRequest[AnyContent] =>
    implicit val m: Messages = messagesApi.preferred(req)
    Ok(mgr.sceneHtml)
  }

  def mainMenu(): Action[AnyContent]         = scene("main-menu")
  def singleplayer(): Action[AnyContent]     = scene("singleplayer")
  def multiplayer(): Action[AnyContent]      = scene("multiplayer")
  def ai(): Action[AnyContent]               = scene("ai")
  def loadGame(): Action[AnyContent]         = scene("load-game")
  def playingField(): Action[AnyContent]     = scene("playing-field")
  def attackerHand(): Action[AnyContent]     = scene("attacker-hand")
  def attackerDefenders(): Action[AnyContent]= scene("attacker-defenders")

  /** POST /game/start-multiplayer */
  def startMultiplayerGame: Action[AnyContent] = Action { implicit req =>
    val data = req.body.asFormUrlEncoded.getOrElse(Map.empty)
    val p1   = data.get("player1").flatMap(_.headOption).getOrElse("Player 1")
    val p2   = data.get("player2").flatMap(_.headOption).getOrElse("Player 2")

    val sid0 = getOrCreateSid(req)

    gameUseCases.createMultiplayer(p1, p2, sid0) match {
      case Right(_webState) =>
        // put sid into the session so subsequent actions use the same game instance
        val nextSession = req.session + ("sid" -> sid0)

        // tell the scene manager to render the PlayingField scene HTML
        GlobalObservable.notifyObservers(SceneSwitchEvent.PlayingField)

        SeeOther(routes.UiController.scene("playing-field").url)
          .withSession(nextSession)
          .flashing("info" -> s"$p1 vs $p2 started")

      case Left(err) =>
        SeeOther(routes.UiController.scene("multiplayer").url)
          .flashing("error" -> s"Failed to start: ${err.message}")
    }
  }
}