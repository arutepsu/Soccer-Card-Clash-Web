package app.controllers.auth

import javax.inject._
import play.api.mvc._
import play.filters.csrf.CSRFAddToken
import app.controllers.support.ControllerSupport

@Singleton
final class BootstrapController @Inject()(
  cc: MessagesControllerComponents,
  addToken: CSRFAddToken
) extends MessagesAbstractController(cc)
  with ControllerSupport {

  def bootstrap(): Action[AnyContent] =
    addToken(Action { implicit req: MessagesRequest[AnyContent] =>
      val sid = getOrCreateSid(req)
      val playerToken = getOrCreatePlayerToken(req)

      NoContent.addingToSession(
        "sid" -> sid.value,
        "playerToken" -> playerToken.value
      )
    })

}
