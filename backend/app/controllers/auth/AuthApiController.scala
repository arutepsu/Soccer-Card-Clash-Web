package app.controllers.auth

import javax.inject._
import play.api.libs.json._
import play.api.mvc._
import play.api.db.Database
import app.auth._
import app.controllers.support.ControllerSupport

import java.time.Instant
import java.util.UUID

@Singleton
final class AuthApiController @Inject()(
  cc: ControllerComponents,
  auth: AuthAction,
  db: Database
) extends AbstractController(cc) with ControllerSupport {

  def me(): Action[AnyContent] = auth { implicit req =>
    try {
      val (id, email, nickname) = upsertAndLoadUser(req.user)

      Ok(Json.obj(
        "loggedIn" -> true,
        "userId" -> id.toString,
        "email" -> email,
        "nickname" -> nickname
      )).addingToSession(
        "uid" -> id.toString,
        "email" -> email.getOrElse(""),
        "nickname" -> nickname.getOrElse("")
      )
    } catch {
      case e: Throwable =>
        InternalServerError(Json.obj(
          "error" -> "auth/me failed",
          "detail" -> e.toString
        ))
    }
  }

  def updateNickname(): Action[JsValue] = auth(parse.json) { req =>
  val nickname = (req.body \ "nickname").asOpt[String].getOrElse("").trim

  if (!isValidNickname(nickname)) {
    BadRequest(Json.obj("error" -> "Invalid nickname (3-20 chars: letters, numbers, _ or -)"))
  } else {
    try {
      val updated = db.withConnection { conn =>
        val ps = conn.prepareStatement(
          """
            UPDATE users
            SET nickname = ?, updated_at = NOW()
            WHERE provider = ? AND subject = ?
          """
        )
        ps.setString(1, nickname)
        ps.setString(2, req.user.provider)
        ps.setString(3, req.user.subject)
        ps.executeUpdate()
      }

      if (updated == 0) {
        upsertAndLoadUser(req.user)
        db.withConnection { conn =>
          val ps2 = conn.prepareStatement(
            "UPDATE users SET nickname = ?, updated_at = NOW() WHERE provider = ? AND subject = ?"
          )
          ps2.setString(1, nickname)
          ps2.setString(2, req.user.provider)
          ps2.setString(3, req.user.subject)
          ps2.executeUpdate()
        }
      }

      Ok(Json.obj("ok" -> true, "nickname" -> nickname))
    } catch {
      case _: org.postgresql.util.PSQLException =>
        Conflict(Json.obj("error" -> "Nickname already taken"))
      case e: Throwable =>
        InternalServerError(Json.obj("error" -> "Failed to update nickname", "detail" -> e.getMessage))
    }
  }
}

  def logout(): Action[AnyContent] = Action { implicit req =>
    Ok(Json.obj("loggedIn" -> false))
      .removingFromSession(
        "uid", "email", "nickname",
        "sid", "playerToken",
        "localSid"
      )
  }
  
  private def upsertAndLoadUser(u: AuthUser): (UUID, Option[String], Option[String]) = {
    db.withConnection { conn =>
      val ps = conn.prepareStatement(
        """
        INSERT INTO users (id, provider, subject, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
        ON CONFLICT (provider, subject)
        DO UPDATE SET email = EXCLUDED.email, updated_at = NOW()
        RETURNING id, email, nickname
        """
      )
      ps.setObject(1, UUID.randomUUID())
      ps.setString(2, u.provider)
      ps.setString(3, u.subject)
      ps.setString(4, u.email.orNull)

      val rs = ps.executeQuery()
      rs.next()
      val id = rs.getObject("id").asInstanceOf[UUID]
      val email = Option(rs.getString("email"))
      val nick = Option(rs.getString("nickname"))
      (id, email, nick)
    }
  }

  private def isValidNickname(s: String): Boolean =
    s.matches("^[A-Za-z0-9_-]{3,20}$")
}
