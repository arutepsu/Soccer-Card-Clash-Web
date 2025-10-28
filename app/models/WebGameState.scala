package app.models

final case class WebGameState(
  roles: RolesView,
  scores: ScoresView,
  cards: CardsView,
  allowed: AllowedActionsView
)
