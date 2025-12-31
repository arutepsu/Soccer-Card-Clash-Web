package app.auth

import javax.inject._
import play.api.mvc._
import play.api.libs.json._
import scala.concurrent.{ExecutionContext, Future}

final case class AuthUser(
  provider: String,
  subject: String,
  email: Option[String]
)

final class AuthRequest[A](val user: AuthUser, request: Request[A])
  extends WrappedRequest[A](request)

@Singleton
final class AuthAction @Inject()(
  bodyParsers: BodyParsers.Default,
  jwt: SupabaseJwt
)(using ec: ExecutionContext)
  extends ActionBuilder[AuthRequest, AnyContent] {

  override protected def executionContext: ExecutionContext = ec
  
  override def invokeBlock[A](
    request: Request[A],
    block: AuthRequest[A] => Future[Result]
  ): Future[Result] = {

    val maybeToken =
      request.headers.get("Authorization")
        .filter(_.startsWith("Bearer "))
        .map(_.drop(7).trim)
        .filter(_.nonEmpty)

    maybeToken match {
      case None =>
        Future.successful(Results.Unauthorized(Json.obj("error" -> "Missing Bearer token")))

      case Some(token) =>
        jwt.verify(token) match {
          case Left(err) =>
            Future.successful(Results.Unauthorized(Json.obj("error" -> "Invalid token", "detail" -> err)))

          case Right(json) =>
            val sub   = (json \ "sub").asOpt[String]
            val email = (json \ "email").asOpt[String]

            sub match {
              case None =>
                Future.successful(Results.Unauthorized(Json.obj("error" -> "Token missing sub claim")))
              case Some(subject) =>
                val user = AuthUser("supabase", subject, email)
                block(new AuthRequest(user, request))
            }
        }
    }
  }

  override def parser: BodyParser[AnyContent] = bodyParsers
}