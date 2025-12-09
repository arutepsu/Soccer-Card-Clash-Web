package app.session

final case class SessionInfo(
  hostName: String,
  hostToken: PlayerToken,
  guestName: Option[String] = None,
  guestToken: Option[PlayerToken] = None
)
