export interface AiPlayerTypeShape {
  kind?: string;
  type?: string;
  strategy?: string;
  [key: string]: unknown;
}

export type PlayerType = 'Human' | AiPlayerTypeShape | string;

export interface PlayerLike {
  id: string;
  name?: string;
  playerType?: PlayerType;
}
