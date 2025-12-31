package app.controllers.db

import javax.inject._
import play.api.mvc._
import play.api.db.Database

@Singleton
class HealthController @Inject()(
  cc: ControllerComponents,
  database: Database
) extends AbstractController(cc) {

  def health: Action[AnyContent] = Action {
    Ok("OK")
  }

  def dbHealth: Action[AnyContent] = Action {
    try {
      val ok = database.withConnection { conn =>
        val st = conn.createStatement()
        val rs = st.executeQuery("SELECT 1")
        rs.next() && rs.getInt(1) == 1
      }
      if (ok) Ok("DB OK") else InternalServerError("DB NOT OK")
    } catch {
      case e: Throwable =>
        InternalServerError("DB ERROR: " + e.getMessage)
    }
  }
}
