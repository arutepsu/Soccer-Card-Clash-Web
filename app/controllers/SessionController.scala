package controllers

import javax.inject._
import play.api.mvc._
import play.api.libs.json._
import app.repositories.GameContextRepository

@Singleton
class SessionController @Inject()(cc: ControllerComponents, repo: GameContextRepository) extends AbstractController(cc) {

  private val JSON = "application/json"

  /*
   GET /api/session/keys
   Returns all active session IDs currently stored in the GameContextRepository.
   */
  def keys(): Action[AnyContent] = Action { implicit request =>
    val ks = repo.keys
    Ok(Json.obj(
      "sessions" -> ks
    )).as(JSON)
  }
}