// app/controllers/TuiController.scala
package controllers

import javax.inject.*
import play.api.mvc.*
import services.webtui.WebTui
import play.api.i18n._

@Singleton
class TuiController @Inject()(
  cc: MessagesControllerComponents,
  webTui: WebTui
) extends MessagesAbstractController(cc) {

    def tui: Action[AnyContent] = Action { implicit req: MessagesRequest[AnyContent] =>
    implicit val m: Messages = messagesApi.preferred(req)
    webTui.bootOnce()
    Ok(views.html.tui("Soccer Card Clash - TUI", webTui.snapshot(), ""))
    }

    def submit: Action[AnyContent] = Action { implicit req: MessagesRequest[AnyContent] =>
    implicit val m: Messages = messagesApi.preferred(req)
    val cmd = req.body.asFormUrlEncoded.flatMap(_("command").headOption).getOrElse("")
    webTui.bootOnce()
    val out = webTui.runAndDrain { webTui.processInputLine(cmd) }
    Ok(views.html.tui("Soccer Card Clash - TUI", out, ""))
    }

}
