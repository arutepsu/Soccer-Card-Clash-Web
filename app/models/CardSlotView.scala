package app.models

final case class CardSlotView(
  id: String,               // slot index-based id: "att-slot-0", etc.
  card: Option[CardView]
)
