package controllers

import javax.inject.*
import play.api.mvc.*
import play.api.i18n.Messages
import services.WebSceneManager
import de.htwg.se.soccercardclash.util.*
import app.api.IGameUseCases
import java.util.UUID
import app.models.AppError
import play.filters.csrf.CSRFAddToken
import play.api.libs.json._
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import scala.util.Try
import app.models.state.WebGameState
import app.session.GameSessionId
import app.models.{AppError}
import app.models.state.WebGameState
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder

@Singleton
class UiController @Inject()(
  cc: MessagesControllerComponents,
  mgr: WebSceneManager,
  gameUseCases: IGameUseCases,
  addToken: CSRFAddToken
) extends MessagesAbstractController(cc) {

  private val slugToEvent: Map[String, SceneSwitchEvent] = Map(
    "MainMenu"              -> SceneSwitchEvent.MainMenu,
    "Multiplayer"           -> SceneSwitchEvent.Multiplayer,
    "SinglePlayer"          -> SceneSwitchEvent.SinglePlayer,
    "AISelection"           -> SceneSwitchEvent.AISelection,
    "LoadGame"              -> SceneSwitchEvent.LoadGame,
    "PlayingField"          -> SceneSwitchEvent.PlayingField,
    "AttackerHandCards"     -> SceneSwitchEvent.AttackerHandCards,
    "AttackerDefenderCards" -> SceneSwitchEvent.AttackerDefenderCards,
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

  def scene(to: String): Action[AnyContent] =
    addToken(Action { implicit req: MessagesRequest[AnyContent] =>
      implicit val m: Messages = messagesApi.preferred(req)

      val sid0          = getOrCreateSid(req)
      val sessionWithSid = req.session + ("sid" -> sid0)

      val internal = prettyToInternal.getOrElse(to, to)
      slugToEvent.get(internal) match {
        case Some(ev) =>
          GlobalObservable.notifyObservers(ev)
          Ok(views.html.scenes.gamepage(internal, mgr.sceneHtml))
            .withSession(sessionWithSid)

        case None =>
          NotFound(s"Unknown scene: $to")
            .withSession(sessionWithSid)
      }
    })

  def sceneCurrent(): Action[AnyContent] =
    addToken(Action { implicit req: MessagesRequest[AnyContent] =>
      implicit val m: Messages = messagesApi.preferred(req)
      val sid0 = getOrCreateSid(req)
      Ok(views.html.scenes.gamepage("PlayingField", mgr.sceneHtml))
        .withSession(req.session + ("sid" -> sid0))
    })

  def switchScene(to: String): Action[AnyContent] = Action { implicit req =>
    val internal = prettyToInternal.getOrElse(to, to)
    val pretty   = prettyToInternal.find(_._2 == internal).map(_._1).getOrElse(internal)
    SeeOther(routes.UiController.scene(pretty).url)
  }

  def mainMenu(): Action[AnyContent]          = scene("main-menu")
  def singleplayer(): Action[AnyContent]      = scene("singleplayer")
  def multiplayer(): Action[AnyContent]       = scene("multiplayer")
  def sessionScreen(): Action[AnyContent]     = addToken(Action { implicit req: MessagesRequest[AnyContent] =>
    val sid0 = getOrCreateSid(req)
    val sessionWithSid = req.session + ("sid" -> sid0)
    Ok(views.html.scenes.sessionScreen()).withSession(sessionWithSid)
  })
  def ai(): Action[AnyContent]                = scene("ai")
  def loadGame(): Action[AnyContent]          = scene("load-game")
  def playingField(): Action[AnyContent]      = scene("playing-field")
  def attackerHand(): Action[AnyContent]      = scene("attacker-hand")
  def attackerDefenders(): Action[AnyContent] = scene("attacker-defenders")

  def startMultiplayerGame: Action[AnyContent] = Action { implicit req =>
    val data = req.body.asFormUrlEncoded.getOrElse(Map.empty)
    val p1   = data.get("player1").flatMap(_.headOption).getOrElse("Player 1")
    val p2   = data.get("player2").flatMap(_.headOption).getOrElse("Player 2")

    val sidRaw = getOrCreateSid(req)
    val sid    = GameSessionId(sidRaw)

    gameUseCases.createGame(p1, p2, sid) match {
      case Right(_webState) =>
        val nextSession = req.session + ("sid" -> sidRaw)
        GlobalObservable.notifyObservers(SceneSwitchEvent.PlayingField)

        SeeOther(routes.UiController.scene("playing-field").url)
          .withSession(nextSession)
          .flashing("info" -> s"$p1 vs $p2 started")

      case Left(err) =>
        SeeOther(routes.UiController.scene("multiplayer").url)
          .flashing("error" -> s"Failed to start: ${err.message}")
    }
  }

  def startSingleplayerGame: Action[AnyContent] = Action { implicit req =>
    val data  = req.body.asFormUrlEncoded.getOrElse(Map.empty)
    val human = data.get("humanPlayer").flatMap(_.headOption).getOrElse("Human")
    val ai    = data.get("aiPlayer").flatMap(_.headOption).getOrElse("Bot")

    val sidRaw = getOrCreateSid(req)
    val sid    = GameSessionId(sidRaw)

    gameUseCases.createGameWithAI(human, ai, sid) match {
      case Right(_webState) =>
        val nextSession = req.session + ("sid" -> sidRaw)
        GlobalObservable.notifyObservers(SceneSwitchEvent.PlayingField)

        SeeOther(routes.UiController.scene("playing-field").url)
          .withSession(nextSession)
          .flashing("info" -> s"$human vs $ai started")

      case Left(err) =>
        SeeOther(routes.UiController.scene("singleplayer").url)
          .flashing("error" -> s"Failed to start: ${err.message}")
    }
  }
  def loginPage(): Action[AnyContent] = Action { implicit req =>
    Ok(views.html.scenes.login())
  }

  def doLogin(): Action[AnyContent] = Action { implicit req =>
    val data = req.body.asFormUrlEncoded.getOrElse(Map.empty)
    val username = data.get("username").flatMap(_.headOption).getOrElse("")
    val password = data.get("password").flatMap(_.headOption).getOrElse("")

    if (username.isEmpty || password.isEmpty) {
      Redirect(routes.UiController.loginPage())
        .flashing("error" -> "Username and password required")
    } else {
      //Fake auth
      Redirect(routes.UiController.mainMenu())
        .withSession(req.session + ("username" -> username))
        .flashing("info" -> s"Welcome, $username")
    }
  }


  def restart: Action[AnyContent] = Action { implicit req =>
    val bodyNames: Option[(String, String)] = for {
      json <- req.body.asJson
      att  <- (json \ "attackerName").asOpt[String].filter(_.nonEmpty)
      defn <- (json \ "defenderName").asOpt[String].filter(_.nonEmpty)
    } yield (att, defn)

    val prevNames: Option[(String, String)] =
      Try {
        val ctx = gameUseCases.holder.get
        (ctx.state.getRoles.attacker.name, ctx.state.getRoles.defender.name)
      }.toOption

    val (attackerName, defenderName) =
      bodyNames.orElse(prevNames).getOrElse(("Player 1", "Player 2"))

    gameUseCases.holder.clear()

    val sidRaw = getOrCreateSid(req)
    val sid    = GameSessionId(sidRaw)

    val createdWeb: Either[AppError, WebGameState] =
      gameUseCases.createGame(attackerName, defenderName, sid)

    createdWeb.fold(
      err =>
        InternalServerError(Json.obj("error" -> err.message))
          .withSession(req.session + ("sid" -> sidRaw)),

      web => {
        Ok(
          Json.obj(
            "status"        -> "restarted",
            "attackerName"  -> attackerName,
            "defenderName"  -> defenderName,
            "state"         -> Json.toJson(web),
            "sessionId"     -> sid.value
          )
        )
          .as("application/json")
          .withSession(req.session + ("sid" -> sidRaw))
      }
    )
  }
}
