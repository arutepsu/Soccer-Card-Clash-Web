package controllers

import javax.inject._
import play.api.mvc._
import play.filters.csrf.CSRFAddToken

@Singleton
class UiController @Inject()(cc: ControllerComponents, addToken: CSRFAddToken)
  extends AbstractController(cc) {

  def index: Action[AnyContent] = addToken(Action { implicit req =>
    Ok(views.html.index("Soccer Card Clash Web"))
  })
}