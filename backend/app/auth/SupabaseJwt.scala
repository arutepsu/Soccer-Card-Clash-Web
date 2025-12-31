package app.auth

import javax.inject._
import pdi.jwt._
import play.api.Configuration
import play.api.libs.json._

@Singleton
final class SupabaseJwt @Inject()(config: Configuration) {

  private val secret = config.get[String]("supabase.jwt.secret")
  private val algo   = JwtAlgorithm.HS256

  def verify(token: String): Either[String, JsObject] = {
    Jwt.decode(token, secret, Seq(algo)).toEither
      .left.map(_.getMessage)
      .flatMap { claim =>
        try Right(Json.parse(claim.content).as[JsObject])
        catch case e: Throwable => Left("Invalid JWT JSON: " + e.getMessage)
      }
  }
}