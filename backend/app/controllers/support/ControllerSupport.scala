package controllers.support

import java.util.UUID
import play.api.mvc.{RequestHeader, Result, Results}
import app.session.GameSessionId
import app.auth.AuthPrincipal

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

  // protected def requirePrincipal(
  //   req: RequestHeader
  // ): Either[Result, Option[AuthPrincipal]] =
  //   Right(principalOpt(req))
}
