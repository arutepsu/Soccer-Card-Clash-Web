package app.api.command

import app.session.GameSessionId
import app.session.PlayerToken
import app.models.AppError
import app.models.state.WebGameState
import app.auth.AuthPrincipal
import app.api.command.CommandMode
import play.api.libs.json.{JsObject, Json}

trait IGameCommandFacade {
  def execute(
    mode: CommandMode,
    sid: GameSessionId,
    principal: Option[AuthPrincipal],
    cmd: GameCommand,
    token: Option[PlayerToken],
    meta: Option[JsObject] = None
  ): Either[AppError, WebGameState]
}
