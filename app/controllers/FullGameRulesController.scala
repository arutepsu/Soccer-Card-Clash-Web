package controllers

import javax.inject._
import play.api.mvc._

@Singleton
class FullGameRulesController @Inject()(cc: ControllerComponents)
  extends AbstractController(cc) {

  def fullRules: Action[AnyContent] = Action {
    Ok(views.html.fullgamerules())
  }

}