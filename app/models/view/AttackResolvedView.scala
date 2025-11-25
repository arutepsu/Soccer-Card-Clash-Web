package app.models.view

import app.models._
import play.api.libs.json._

final case class AttackResolvedView(
  eventId: Long,
  attackerId: String,
  defenderId: String,
  attackingCards: Seq[CardView],
  defendingCard: CardView,
  result: String,
  tieKind: Option[String],
  scores: ScoresView,
  roles: RolesView
)

object AttackResolvedView {
  implicit val writes: OWrites[AttackResolvedView] =
    Json.writes[AttackResolvedView]
}
