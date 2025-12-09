// app/services/webscene/AISelectionWebScene.scala
package services.webscene
import javax.inject.*
import play.twirl.api.Html
import play.api.mvc.RequestHeader
import play.api.i18n.Messages
@Singleton
class AISelectionWebScene @Inject()() extends WebScene {
  override def render()(implicit rh: RequestHeader, m: play.api.i18n.Messages): Html = views.html.scenes.aiSelection()
}
