package app.controllers.ui

import javax.inject._
import play.api.Environment
import play.api.http.ContentTypes
import play.api.i18n._
import play.api.mvc._
import play.filters.csrf.CSRFAddToken
import app.controllers.support.ControllerSupport

@Singleton
final class SpaController @Inject()(
  cc: MessagesControllerComponents,
  addToken: CSRFAddToken,
  env: Environment
) extends MessagesAbstractController(cc)
    with ControllerSupport {

  def index(path: String): Action[AnyContent] =
    addToken(Action { implicit req: MessagesRequest[AnyContent] =>
      val sid = getOrCreateSid(req)

      env.resourceAsStream("public/web/index.html") match {
        case None =>
          NotFound("Frontend not built. Ensure backend/public/web/index.html exists.")
        case Some(is) =>
          val html = scala.io.Source.fromInputStream(is, "UTF-8").mkString
          Ok(html)
            .as(ContentTypes.HTML)
            .addingToSession("sid" -> sid.value)
      }
    })
}

