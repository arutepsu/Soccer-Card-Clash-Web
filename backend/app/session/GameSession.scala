package app.session

import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext

final case class GameSessionId(value: String) extends AnyVal {
  override def toString: String = value
}

final case class PlayerToken(value: String) extends AnyVal {
  override def toString: String = value
}

final case class SessionCreated(
  id: GameSessionId,
  hostToken: PlayerToken
)

final case class SessionJoined(
  id: GameSessionId,
  guestToken: PlayerToken,
)

case class GameSession(
  id: GameSessionId,
  hostToken: PlayerToken,
  guestToken: Option[PlayerToken],
  ctx: GameContext 
)
