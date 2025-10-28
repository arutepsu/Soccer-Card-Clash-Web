package app.models
final case class CardView(
  id: String,
  rank: String,
  suit: String,
  value: Int,
  boosted: Boolean
)
