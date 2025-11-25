package app.models.view
import play.api.libs.json._

final case class DoubleAttackCommandView(
  target: String,
  index: Int
)
object DoubleAttackCommandView {
  implicit val format: OFormat[DoubleAttackCommandView] = Json.format[DoubleAttackCommandView]
}
