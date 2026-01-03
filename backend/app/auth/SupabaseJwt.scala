package app.auth

import javax.inject._
import play.api.Configuration
import play.api.libs.json._
import pdi.jwt._

import java.net.URI
import java.net.http.{HttpClient, HttpRequest, HttpResponse}
import java.math.BigInteger
import java.security.{AlgorithmParameters, KeyFactory, PublicKey}
import java.security.interfaces.RSAPublicKey
import java.security.spec._
import java.util.Base64
import scala.concurrent.duration._
import io.github.cdimascio.dotenv.Dotenv

@Singleton
final class SupabaseJwt @Inject()(config: Configuration) {

  private val dotenv = Dotenv.configure().ignoreIfMissing().load()

  private def env(key: String): Option[String] =
    Option(System.getenv(key))
      .orElse(Option(dotenv.get(key)))
      .map(_.trim)
      .filter(_.nonEmpty)

  private val hsSecretOpt =
    env("SUPABASE_JWT_SECRET")
      .orElse(config.getOptional[String]("supabase.jwt.secret").map(_.trim).filter(_.nonEmpty))

  private val jwksUrlOpt =
    env("SUPABASE_JWKS_URL")
      .orElse(config.getOptional[String]("supabase.jwt.jwksUrl").map(_.trim).filter(_.nonEmpty))

  println("[SupabaseJwt] env jwksUrl = " + env("SUPABASE_JWKS_URL"))
  println("[SupabaseJwt] env secret set? " + env("SUPABASE_JWT_SECRET").nonEmpty)

  private val http = HttpClient.newHttpClient()

  private val jwksTtl: FiniteDuration = 10.minutes
  @volatile private var cachedAtMs: Long = 0L
  @volatile private var cachedKeys: Map[String, PublicKey] = Map.empty

  /** Verify Supabase JWT and return its JSON payload */
  def verify(token: String): Either[String, JsObject] = {

    val alg = readHeaderField(token, "alg").getOrElse("")
    println(s"[SupabaseJwt] alg=${readHeaderField(token,"alg")} kid=${readHeaderField(token,"kid")} jwksUrlSet=${jwksUrlOpt.nonEmpty}")
    alg match {
      case "HS256" => verifyHs256(token)
      case "RS256" => verifyRs256(token)
      case "ES256" => verifyEs256(token)
      case other =>
        // If alg is unknown, try the most likely ones (Supabase commonly ES256).
        verifyEs256(token)
          .orElse(verifyRs256(token))
          .orElse(verifyHs256(token))
          .left.map(_ => s"Unsupported JWT alg: $other")
    }

  }

  private def verifyHs256(token: String): Either[String, JsObject] = {
    val secret = hsSecretOpt.getOrElse("")
    if (secret.isEmpty) return Left("HS256 secret not configured")

    Jwt.decode(token, secret, Seq(JwtAlgorithm.HS256)).toEither
      .left.map(_.getMessage)
      .flatMap(claimToJson)
  }

  private def verifyRs256(token: String): Either[String, JsObject] = {
    val jwksUrl = jwksUrlOpt.getOrElse("")
    if (jwksUrl.isEmpty) return Left("JWKS URL not configured")

    val kid = readHeaderField(token, "kid").getOrElse(return Left("JWT missing kid (RS256)"))

    val pubKey =
      getKeyFromJwks(jwksUrl, kid).getOrElse(return Left(s"No JWKS key for kid=$kid"))

    Jwt.decode(token, pubKey, Seq(JwtAlgorithm.RS256)).toEither
      .left.map(_.getMessage)
      .flatMap(claimToJson)
  }

  private def verifyEs256(token: String): Either[String, JsObject] = {
    val jwksUrl = jwksUrlOpt.getOrElse("")
    if (jwksUrl.isEmpty) return Left("JWKS URL not configured")

    val kid = readHeaderField(token, "kid").getOrElse(return Left("JWT missing kid (ES256)"))

    val pubKey =
      getKeyFromJwks(jwksUrl, kid).getOrElse(return Left(s"No JWKS key for kid=$kid"))

    Jwt.decode(token, pubKey, Seq(JwtAlgorithm.ES256)).toEither match {
      case Left(e) =>
        println("[SupabaseJwt] ES256 decode failed: " + e.getMessage)
        Left(e.getMessage)

      case Right(claim) =>
        println("[SupabaseJwt] ES256 claim content FULL: " + claim.content)
        claimToJson(claim)
    }

  }

  private def getKeyFromJwks(jwksUrl: String, kid: String): Option[PublicKey] = {
    val now = System.currentTimeMillis()
    val expired = (now - cachedAtMs) > jwksTtl.toMillis

    if (expired || cachedKeys.isEmpty) {
      fetchAndCacheJwks(jwksUrl)
    }

    cachedKeys.get(kid)
  }

  private def fetchAndCacheJwks(jwksUrl: String): Unit = {
    try {
      val req = HttpRequest.newBuilder()
        .uri(URI.create(jwksUrl))
        .GET()
        .build()

      val res = http.send(req, HttpResponse.BodyHandlers.ofString())
      if (res.statusCode() / 100 != 2) return

      val json = Json.parse(res.body()).as[JsObject]
      val keys = (json \ "keys").asOpt[JsArray].getOrElse(JsArray())

      val parsed: Map[String, PublicKey] =
        keys.value.flatMap { k =>
          val kidOpt = (k \ "kid").asOpt[String]
          val ktyOpt = (k \ "kty").asOpt[String]

          (kidOpt, ktyOpt) match {

            // --- EC (ES256) ---
            case (Some(kid), Some("EC")) =>
              val crvOpt = (k \ "crv").asOpt[String]
              val xOpt   = (k \ "x").asOpt[String]
              val yOpt   = (k \ "y").asOpt[String]

              (crvOpt, xOpt, yOpt) match {
                case (Some("P-256"), Some(x), Some(y)) =>
                  jwkToEcPublicKeyP256(x, y).toOption.map(pub => kid -> pub)
                case _ =>
                  None
              }

            // --- RSA (RS256) ---
            case (Some(kid), Some("RSA")) =>
              val nOpt = (k \ "n").asOpt[String]
              val eOpt = (k \ "e").asOpt[String]
              (nOpt, eOpt) match {
                case (Some(n), Some(e)) =>
                  jwkToRsaPublicKey(n, e).toOption.map(pub => kid -> pub)
                case _ =>
                  None
              }

            case _ =>
              None
          }
        }.toMap

      if (parsed.nonEmpty) {
        cachedKeys = parsed
        cachedAtMs = System.currentTimeMillis()
      }
    } catch {
      case _: Throwable =>
        ()
    }
  }

  private def jwkToRsaPublicKey(nB64Url: String, eB64Url: String): Either[String, RSAPublicKey] = {
    try {
      val nBytes = base64UrlDecode(nB64Url)
      val eBytes = base64UrlDecode(eB64Url)

      val n = new BigInteger(1, nBytes)
      val e = new BigInteger(1, eBytes)

      val spec = new RSAPublicKeySpec(n, e)
      val kf = KeyFactory.getInstance("RSA")
      Right(kf.generatePublic(spec).asInstanceOf[RSAPublicKey])
    } catch {
      case t: Throwable => Left("Failed to build RSA public key: " + t.getMessage)
    }
  }

  /** Build EC public key for P-256 (secp256r1) from JWKS x/y */
  private def jwkToEcPublicKeyP256(xB64Url: String, yB64Url: String): Either[String, PublicKey] = {
    try {
      val xBytes = base64UrlDecode(xB64Url)
      val yBytes = base64UrlDecode(yB64Url)

      val x = new BigInteger(1, xBytes)
      val y = new BigInteger(1, yBytes)

      val params = AlgorithmParameters.getInstance("EC")
      params.init(new ECGenParameterSpec("secp256r1")) // == P-256
      val ecSpec = params.getParameterSpec(classOf[java.security.spec.ECParameterSpec])

      val point   = new java.security.spec.ECPoint(x, y)
      val pubSpec = new ECPublicKeySpec(point, ecSpec)

      val kf = KeyFactory.getInstance("EC")
      Right(kf.generatePublic(pubSpec))
    } catch {
      case t: Throwable => Left("Failed to build EC public key (P-256): " + t.getMessage)
    }
  }

  private def base64UrlDecode(s: String): Array[Byte] =
    Base64.getUrlDecoder.decode(s)

  private def readHeaderField(token: String, field: String): Option[String] =
    readJwtHeader(token).flatMap(h => (h \ field).asOpt[String])

  private def readJwtHeader(token: String): Option[JsObject] = {
    val parts = token.split("\\.")
    if (parts.length < 2) return None
    val headerB64 = parts(0)
    try {
      val jsonStr = new String(Base64.getUrlDecoder.decode(headerB64), "UTF-8")
      Some(Json.parse(jsonStr).as[JsObject])
    } catch {
      case _: Throwable => None
    }
  }

  private def claimToJson(claim: JwtClaim): Either[String, JsObject] = {
    try Right(Json.parse(claim.content).as[JsObject])
    catch case t: Throwable => Left("Invalid JWT JSON: " + t.getMessage)
  }
}
