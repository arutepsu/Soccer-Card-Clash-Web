package app.controllers.support

import java.util.UUID
import play.api.mvc.{RequestHeader, Result, Results}
import play.api.libs.json.Json

import app.session.{GameSessionId, PlayerToken}
import app.auth.{AuthPrincipal, SupabaseJwt}

trait ControllerSupport { self: Results =>

  protected def getOrCreateSid(req: RequestHeader): GameSessionId =
    req.session
      .get("sid")
      .map(GameSessionId.apply)
      .getOrElse(GameSessionId(UUID.randomUUID().toString))

  protected def getOrCreateLocalSid(req: RequestHeader): GameSessionId =
    req.session
      .get("localSid")
      .map(GameSessionId.apply)
      .getOrElse(GameSessionId(UUID.randomUUID().toString))

  protected def requirePrincipal(req: RequestHeader)(using jwt: SupabaseJwt): Either[Result, AuthPrincipal] = {
    val maybeToken =
      req.headers.get("Authorization")
        .filter(_.startsWith("Bearer "))
        .map(_.drop(7).trim)
        .filter(_.nonEmpty)

    maybeToken match {
      case None =>
        Left(Unauthorized(Json.obj("error" -> "Missing Bearer token")))

      case Some(token) =>
        jwt.verify(token) match {
          case Left(err) =>
            Left(Unauthorized(Json.obj("error" -> "Invalid token", "detail" -> err)))

          case Right(json) =>
            (json \ "sub").asOpt[String] match {
              case None =>
                Left(Unauthorized(Json.obj("error" -> "Token missing sub claim")))

              case Some(sub) =>
                val email = (json \ "email").asOpt[String]

                val nickname =
                  (json \ "user_metadata" \ "nickname").asOpt[String]
                    .orElse(email.map(_.takeWhile(_ != '@')).filter(_.nonEmpty))
                    .orElse(Some(sub.take(8)))

                Right(AuthPrincipal(
                  userId = sub,
                  email = email,
                  nickname = nickname
                ))
            }
        }
    }
  }

  protected def requirePlayerToken(req: RequestHeader): Either[Result, PlayerToken] =
    req.session.get("playerToken") match {
      case Some(t) if t.trim.nonEmpty => Right(PlayerToken(t.trim))
      case _ =>
        req.headers.get("X-Player-Token").map(_.trim).filter(_.nonEmpty) match {
          case Some(t) => Right(PlayerToken(t))
          case None    => Left(Unauthorized(Json.obj("error" -> "Missing playerToken")))
        }
    }

  protected def requireSid(req: RequestHeader): Either[Result, GameSessionId] =
    req.session.get("sid") match {
      case Some(raw) => Right(GameSessionId(raw))
      case None      => Left(Unauthorized(Json.obj("error" -> "Missing sid in session")))
    }
}
