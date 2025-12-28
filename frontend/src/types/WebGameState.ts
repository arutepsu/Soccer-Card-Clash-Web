import { PlayerSide } from "@/utils/playerSideRegistry";

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

export interface AiPlayerTypeShape {
  kind?: string;
  type?: string;
  strategy?: string;
  [key: string]: unknown;
}

export type PlayerType = 'Human' | string | AiPlayerTypeShape;

export interface PlayerLike {
  id: string;
  name?: string;
  playerType?: PlayerType;
}

export interface YouView {
  userId: string;
  username: string;
  side: PlayerSide;
  isAttacker: boolean;
}

export interface WebGameState {
  roles: RolesView;
  scores: ScoresView;
  cards: CardsView;
  allowed: AllowedActionsView;

  you?: YouView;

  players?: {
    attacker?: PlayerLike;
    defender?: PlayerLike;
  };
}