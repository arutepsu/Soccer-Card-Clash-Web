export interface CardView {
  id: string;
  rank: string;
  suit: string;
  value: number;
  boosted: boolean;
  fileName: string;
}

export interface CardSlotView {
  id: string;
  card?: CardView | null;
}

export interface RolesView {
  attacker: string;
  defender: string;
}

export interface ScoresView {
  attacker: number;
  defender: number;
}

export interface CardsView {
  attackerHand: CardView[];
  defenderHand: CardView[];

  attackerField: CardSlotView[];
  defenderField: CardSlotView[];

  attackerGoalkeeper?: CardView | null;
  defenderGoalkeeper?: CardView | null;
}

export interface ActionLimitsView {
  swapRemaining: number;
  boostRemaining: number;
  doubleAttackRemaining: number;
}

export interface AllowedActionsView {
  attacker: ActionLimitsView;
  defender: ActionLimitsView;
}

export interface WebGameState {
  roles: RolesView;
  scores: ScoresView;
  cards: CardsView;
  allowed: AllowedActionsView;
}
