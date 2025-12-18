
package controllers

import scala.concurrent.Future
import javax.inject._
import play.api.mvc._

@Singleton
class SpaController @Inject()(cc: ControllerComponents) extends AbstractController(cc) {
  def index(path: String) = Action.async { implicit request =>
    Future.successful(
      Ok.sendFile(
        new java.io.File("backend/public/index.html")
      )(cc.executionContext, cc.fileMimeTypes)
    )
  }
}
