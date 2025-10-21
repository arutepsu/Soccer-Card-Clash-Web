package controllers

import javax.inject._
import play.api.mvc._
import play.api.data._
import play.api.data.Forms._
import services.WebTui

@Singleton
class UiController @Inject()(
  cc: MessagesControllerComponents,
  webTui: WebTui
) extends MessagesAbstractController(cc) {

  def index: Action[AnyContent] = Action { implicit request: MessagesRequest[AnyContent] =>
    webTui.bootOnce()
    Ok(views.html.index("Soccer Card Clash Web", webTui.snapshot(), ""))
  }

  def submit: Action[AnyContent] = Action { implicit request: MessagesRequest[AnyContent] =>
    val cmd = request.body.asFormUrlEncoded
      .flatMap(_.get("command").flatMap(_.headOption))
      .getOrElse("")
    val out = webTui.runAndDrain { webTui.processInputLine(cmd) }
    Ok(views.html.index("Soccer Card Clash Web", out, ""))
  }

}
