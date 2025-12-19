package app.auth

final case class AuthPrincipal(
  userId: String,
  username: String
)

object AuthPrincipal {
  val anonymous: AuthPrincipal =
    AuthPrincipal(userId = "anon", username = "anonymous")
}