// src/types/Player.ts
export interface AiPlayerTypeShape {
  kind: 'AI';
  strategy?: string;
  [key: string]: unknown;
}
export type PlayerType = 'Human' | AiPlayerTypeShape | string;

export interface PlayerLike {
  id: string;
  name?: string;
  playerType?: PlayerType;
}
