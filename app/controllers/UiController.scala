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

  def game: Action[AnyContent] = Action { implicit request =>
    webTui.bootOnce()
    Ok(views.html.game("Soccer Card Clash Web", webTui.snapshot(), ""))
  }

  def submit: Action[AnyContent] = Action { implicit request =>
    val cmd = request.body.asFormUrlEncoded
      .flatMap(_.get("command").flatMap(_.headOption))
      .getOrElse("")

    webTui.bootOnce()
    webTui.processInputLine(cmd)

    Redirect(routes.UiController.game)
  }
}
