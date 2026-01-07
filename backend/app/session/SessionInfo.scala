package app.session

final case class SessionInfo(
  sessionName: String,
  hostName: String,
  hostToken: PlayerToken,
  hostUserId: String,

  guestName: Option[String],
  guestToken: Option[PlayerToken],
  guestUserId: Option[String],

  state: SessionState,

  nameToUserId: Map[String, String] = Map.empty,

  hostConnected: Boolean = true,
  guestConnected: Boolean = true,
  lastSeenHostMs: Long = System.currentTimeMillis(),
  lastSeenGuestMs: Long = System.currentTimeMillis()
)

object SessionInfo {
  def norm(s: String): String = s.trim.toLowerCase
}
