package filters

import akka.stream.Materializer
import javax.inject._
import play.api.Logger
import play.api.mvc._
import scala.concurrent.{ExecutionContext, Future}

@Singleton
class AccessLog @Inject()(
  implicit val mat: Materializer,
  ec: ExecutionContext
) extends Filter {

  private val log = Logger("access")

  def apply(next: RequestHeader => Future[Result])(rh: RequestHeader): Future[Result] = {
    val start = System.nanoTime()
    next(rh).map { res =>
      val ms = (System.nanoTime() - start) / 1000000
      val ua = rh.headers.get("User-Agent").getOrElse("-")
      val ip = rh.headers.get("X-Forwarded-For")
        .flatMap(_.split(",").headOption.map(_.trim))
        .getOrElse(rh.remoteAddress)
      log.info(s"${rh.method} ${rh.uri} ${res.header.status} ${ms}ms $ip $ua")
      res
    }
  }
}
