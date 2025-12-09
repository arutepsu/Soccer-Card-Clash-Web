// app/services/webscene/AttackerDefendersWebScene.scala
package services.webscene
import javax.inject.*
import play.twirl.api.Html
import play.api.mvc.RequestHeader
import play.api.i18n.Messages
@Singleton
class AttackerDefendersWebScene @Inject()() extends WebScene {
  override def render()(implicit rh: RequestHeader, m: play.api.i18n.Messages): Html = views.html.scenes.attackerDefenders()
}
