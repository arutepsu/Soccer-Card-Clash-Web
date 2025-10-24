// controllers/UiController.scala
package controllers

import javax.inject.*
import play.api.mvc.*
import play.api.i18n.Messages
import services.WebSceneManager
import de.htwg.se.soccercardclash.util.*

@Singleton
class UiController @Inject()(
  cc: MessagesControllerComponents,
  mgr: WebSceneManager
) extends MessagesAbstractController(cc) {

  def game(): Action[AnyContent] = Action { implicit req: MessagesRequest[AnyContent] =>
    implicit val m: Messages = messagesApi.preferred(req)
    Ok(views.html.scenes.gamepage("Soccer Card Clash Web", mgr.sceneHtml))
  }

  def switchScene(to: String): Action[AnyContent] = Action { implicit req: MessagesRequest[AnyContent] =>
    implicit val m: Messages = messagesApi.preferred(req)
    val tgt: Option[SceneSwitchEvent] = to match {
      case "MainMenu"              => Some(SceneSwitchEvent.MainMenu)
      case "Multiplayer"           => Some(SceneSwitchEvent.Multiplayer)
      case "SinglePlayer"          => Some(SceneSwitchEvent.SinglePlayer)
      case "AISelection"           => Some(SceneSwitchEvent.AISelection)
      case "LoadGame"              => Some(SceneSwitchEvent.LoadGame)
      case "PlayingField"          => Some(SceneSwitchEvent.PlayingField)
      case "AttackerHandCards"     => Some(SceneSwitchEvent.AttackerHandCards)
      case "AttackerDefenderCards" => Some(SceneSwitchEvent.AttackerDefenderCards)
      case _ => None
    }
    tgt.foreach(GlobalObservable.notifyObservers)
    Redirect(routes.UiController.game())
  }

  def sceneCurrent(): Action[AnyContent] = Action { implicit req: MessagesRequest[AnyContent] =>
    implicit val m: Messages = messagesApi.preferred(req)
    Ok(mgr.sceneHtml)
  }
}
