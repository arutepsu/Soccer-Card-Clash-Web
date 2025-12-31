package app.auth

final case class AuthPrincipal(
  userId: String,
  email: Option[String],
  nickname: Option[String]
)

object AuthPrincipal {
  val anonymous: AuthPrincipal =
    AuthPrincipal(userId = "anon", email = None, nickname = Some("anonymous"))
}
