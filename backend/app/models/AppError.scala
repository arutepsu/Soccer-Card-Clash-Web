package app.models
import play.api.libs.json._

final case class AppError(message: String)
object AppError {
  implicit val writes: OWrites[AppError] = Json.writes[AppError]
}
