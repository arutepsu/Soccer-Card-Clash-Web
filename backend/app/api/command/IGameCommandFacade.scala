package app.api.command

import app.session.GameSessionId
import app.session.PlayerToken
import app.models.AppError
import app.models.state.WebGameState
import app.auth.AuthPrincipal

trait IGameCommandFacade {
  /** Executes a command and returns the WebGameState.
    * Publishes to GameEventHub exactly once on success.
    *
    * token:
    * - Some(token) => online multiplayer path (session must exist, auth enforced)
    * - None        => local/offline path (no sessionRepo required)
    */
  def execute(
    sid: GameSessionId,
    principal: Option[AuthPrincipal],
    cmd: GameCommand,
    requestId: Option[String] = None
  ): Either[AppError, WebGameState]
}
