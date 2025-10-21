package controllers

import javax.inject._
import play.api.mvc._

@Singleton
class RulesController @Inject()(cc: ControllerComponents)
  extends AbstractController(cc) {

  def rules: Action[AnyContent] = Action {
    Ok(views.html.rules())
  }
}