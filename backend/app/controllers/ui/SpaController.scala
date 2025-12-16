package app.controllers.ui

import javax.inject._
import play.api.mvc._
import play.api.i18n._
import play.filters.csrf.CSRFAddToken
import controllers.support.ControllerSupport

@Singleton
final class SpaController @Inject()(
  cc: MessagesControllerComponents,
  addToken: CSRFAddToken
) extends MessagesAbstractController(cc)
  with ControllerSupport {

  def index(): Action[AnyContent] = addToken(Action { implicit req: MessagesRequest[AnyContent] =>
    val sid = getOrCreateSid(req)
    Ok(views.html.index())
      .addingToSession("sid" -> sid.value)
  })
}
