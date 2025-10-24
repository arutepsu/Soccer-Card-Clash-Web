// services/WebSceneManager.scala
package services

import javax.inject.*
import play.api.mvc.RequestHeader
import play.api.i18n.Messages
import play.twirl.api.Html
import de.htwg.se.soccercardclash.util.*
import services.webscene.*

@Singleton
class WebSceneManager @Inject()(factory: WebSceneFactory)
  extends Observable with Observer {

  private var current: Option[WebScene] = None
  private var currentId: SceneSwitchEvent = SceneSwitchEvent.MainMenu
  private var cached: Option[Html] = None

  GlobalObservable.add(this)

  override def update(e: ObservableEvent): Unit = e match {
    case s: SceneSwitchEvent =>
      current.foreach(_.deactivate())
      current = Some(factory.create(s))
      currentId = s
      cached = None
      current.foreach(_.activate())
      notifyObservers(SceneChangedEvent(s))
    case _ => ()
  }

  def sceneHtml(implicit rh: RequestHeader, m: Messages): Html =
    cached.getOrElse {
      val html = current match {
        case Some(s) => s.render()
        case None =>
          val s = factory.create(currentId)
          current = Some(s); s.activate(); s.render()
      }
      cached = Some(html); html
    }
}
