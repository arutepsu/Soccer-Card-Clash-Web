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
            println(s"[AuthAction] jwt.verify failed: $err")
            Future.successful(Results.Unauthorized(Json.obj("error" -> "Invalid token", "detail" -> err)))

          case Right(json) =>
            println("[AuthAction] jwt payload keys: " + json.keys.mkString(","))

            val subjectOpt =
              (json \ "sub").asOpt[String]
                .orElse((json \ "user_id").asOpt[String])
                .orElse((json \ "uid").asOpt[String])
                .orElse((json \ "user_metadata" \ "sub").asOpt[String])
                .orElse((json \ "user_metadata" \ "user_id").asOpt[String])
                .orElse((json \ "email").asOpt[String])

            val email =
              (json \ "email").asOpt[String]
                .orElse((json \ "user_metadata" \ "email").asOpt[String])

            subjectOpt match {
              case None =>
                Future.successful(Results.Unauthorized(Json.obj(
                  "error" -> "Token missing subject claim",
                  "hint"  -> "Expected sub/user_id/uid or user_metadata.sub"
                )))
              case Some(subject) =>
                val user = AuthUser("supabase", subject, email)
                block(new AuthRequest(user, request))
            }

        }
    }
  }

  override def parser: BodyParser[AnyContent] = bodyParsers
}