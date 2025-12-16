package app.session

final case class SessionInfo(
  hostName: String,
  hostToken: PlayerToken,
  hostUserId: String,

  guestName: Option[String],
  guestToken: Option[PlayerToken],
  guestUserId: Option[String]
)
