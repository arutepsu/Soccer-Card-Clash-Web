package app.controllers.support

import java.util.UUID
import play.api.mvc.{RequestHeader, Result, Results}
import play.api.libs.json.Json

import app.session.{GameSessionId, PlayerToken}
import app.auth.{AuthPrincipal, SupabaseJwt}
import app.api.command.CommandMode

trait ControllerSupport { self: Results =>

  protected def getOrCreateSid(req: RequestHeader): GameSessionId =
    req.session
      .get("sid")
      .map(GameSessionId.apply)
      .getOrElse(GameSessionId(UUID.randomUUID().toString))

  protected def getOrCreatePlayerToken(req: RequestHeader): PlayerToken =
    req.session
      .get("playerToken")
      .map(_.trim)
      .filter(_.nonEmpty)
      .map(PlayerToken.apply)
      .getOrElse(PlayerToken(UUID.randomUUID().toString))

  protected def getOrCreateLocalSid(req: RequestHeader): GameSessionId =
    req.session
      .get("localSid")
      .map(GameSessionId.apply)
      .getOrElse(GameSessionId(UUID.randomUUID().toString))

  private def readBearerFromHeader(req: RequestHeader): Option[String] =
    req.headers
      .get("Authorization")
      .map(_.trim)
      .filter(_.startsWith("Bearer "))
      .map(_.drop("Bearer ".length).trim)
      .filter(_.nonEmpty)

  private def readBearerFromQuery(req: RequestHeader): Option[String] =
    req.getQueryString("token")
      .map(_.trim)
      .filter(_.nonEmpty)

  protected def requirePrincipal(req: RequestHeader)(using jwt: SupabaseJwt): Either[Result, AuthPrincipal] = {
    val maybeToken =
      req.headers
        .get("Authorization")
        .map(_.trim)
        .filter(_.startsWith("Bearer "))
        .map(_.drop("Bearer ".length).trim)
        .filter(_.nonEmpty)
        .orElse(
          req.getQueryString("token").map(_.trim).filter(_.nonEmpty)
        )

    maybeToken match {
      case None =>
        Left(Unauthorized(Json.obj("error" -> "Missing Bearer token")))

      case Some(token) =>
        jwt.verify(token) match {
          case Left(err) =>
            Left(Unauthorized(Json.obj("error" -> "Invalid token", "detail" -> err)))

          case Right(json) =>
            val uidOpt =
              (json \ "sub").asOpt[String]
                .orElse((json \ "user_id").asOpt[String])
                .orElse((json \ "uid").asOpt[String])
                .orElse((json \ "user_metadata" \ "sub").asOpt[String])
                .orElse((json \ "user_metadata" \ "user_id").asOpt[String])

            uidOpt match {
              case None =>
                Left(Unauthorized(Json.obj("error" -> "Token missing user id claim")))

              case Some(uid) =>
                val email = (json \ "email").asOpt[String]

                val nickname =
                  (json \ "user_metadata" \ "nickname").asOpt[String]
                    .orElse(email.map(_.takeWhile(_ != '@')).filter(_.nonEmpty))
                    .orElse(Some(uid.take(8)))

                Right(AuthPrincipal(
                  userId = uid,
                  email = email,
                  nickname = nickname
                ))
            }
        }
    }
  }

protected def requireSessionPrincipal(req: RequestHeader): Either[Result, AuthPrincipal] = {
  val uid = req.session.get("uid").map(_.trim).filter(_.nonEmpty)
  if (uid.isEmpty) return Left(Unauthorized(Json.obj("error" -> "Not logged in")))

  val email = req.session.get("email").map(_.trim).filter(_.nonEmpty)
  val nickname = req.session.get("nickname").map(_.trim).filter(_.nonEmpty)

  Right(AuthPrincipal(
    userId = uid.get,
    email = email,
    nickname = nickname
  ))
}

  protected def requirePlayerToken(req: RequestHeader): Either[Result, PlayerToken] =
    req.session.get("playerToken").map(_.trim).filter(_.nonEmpty) match {
      case Some(t) => Right(PlayerToken(t))
      case None =>
        req.getQueryString("playerToken").map(_.trim).filter(_.nonEmpty) match {
          case Some(t) => Right(PlayerToken(t))
          case None =>
            req.headers.get("X-Player-Token").map(_.trim).filter(_.nonEmpty) match {
              case Some(t) => Right(PlayerToken(t))
              case None    => Left(Unauthorized(Json.obj("error" -> "Missing playerToken")))
            }
        }
    }

  protected def requireSid(req: RequestHeader): Either[Result, GameSessionId] =
    req.session.get("sid") match {
      case Some(raw) => Right(GameSessionId(raw))
      case None      => Left(Unauthorized(Json.obj("error" -> "Missing sid in session")))
    }

  protected def hasSessionKey(req: RequestHeader, key: String): Boolean =
    req.session.get(key).exists(_.trim.nonEmpty)

  protected def ensureSessionKey(req: RequestHeader, res: Result, key: String, value: String): Result =
    if (hasSessionKey(req, key)) res else res.addingToSession(key -> value)(req)

  protected def ensureSid(req: RequestHeader, res: Result, sid: GameSessionId): Result =
    ensureSessionKey(req, res, "sid", sid.value)

  protected def ensureLocalSid(req: RequestHeader, res: Result, sid: GameSessionId): Result =
    ensureSessionKey(req, res, "localSid", sid.value)

  protected def ensurePlayerToken(req: RequestHeader, res: Result, token: PlayerToken): Result =
    ensureSessionKey(req, res, "playerToken", token.value)

  protected def withSidForMode(mode: CommandMode, req: RequestHeader)(f: GameSessionId => Result): Result = {
    val sid =
      mode match {
        case CommandMode.online => getOrCreateSid(req)
        case _                  => getOrCreateLocalSid(req)
      }

    val res0 = f(sid)

    mode match {
      case CommandMode.online => ensureSid(req, res0, sid)
      case _                  => ensureLocalSid(req, res0, sid)
    }
  }
}
