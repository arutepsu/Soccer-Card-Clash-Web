package controllers.support

import java.util.UUID
import play.api.Configuration
import play.api.mvc.{RequestHeader, Result, Results}
import app.session.GameSessionId
import app.auth.AuthPrincipal

// fix after real auth
trait ControllerSupport { self: Results =>

  protected def getOrCreateSid(req: RequestHeader): GameSessionId =
    req.session
      .get("sid")
      .map(GameSessionId.apply)
      .getOrElse(GameSessionId(UUID.randomUUID().toString))

  protected def principalOpt(req: RequestHeader): Option[AuthPrincipal] =
    req.session.get("username").map(u => AuthPrincipal(userId = u, username = u))

  protected def requirePrincipal(req: RequestHeader): Either[Result, AuthPrincipal] =
    principalOpt(req).toRight(Unauthorized("Not authenticated"))
    
  protected def requireSid(req: RequestHeader): Either[Result, GameSessionId] =
    req.session.get("sid") match {
      case Some(raw) => Right(GameSessionId(raw))
      case None      => Left(Unauthorized("Missing sid in session"))
    }

  protected def principalOrAnonymous(
    req: RequestHeader
  )(using cfg: Configuration): Either[Result, AuthPrincipal] =
    requirePrincipal(req) match {
      case Right(p) => Right(p)
      case Left(_) =>
        if (cfg.getOptional[Boolean]("app.auth.devAnonymous").contains(true))
          Right(AuthPrincipal.anonymous)
        else
          Left(Unauthorized("Not authenticated"))
    }
}
