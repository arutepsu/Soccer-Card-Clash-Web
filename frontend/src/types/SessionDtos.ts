export type SessionStatusDto = 'Waiting' | 'Ready' | 'Started' | 'Full';

export interface SessionDto {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  status: SessionStatusDto;
}

export interface CreateSessionRequestDto {
  hostName: string;
  name: string;
}

export interface JoinSessionRequestDto {
  playerName: string;
}

export interface SessionCreatedResponseDto {
  id: string;
  sessionId: string;
  hostToken: string;
}

export interface SessionJoinedResponseDto {
  sessionId: string;
  playerToken: string;
}

export type SessionEndedMeta = {
  action: 'SessionEnded';
  leftPlayerName?: string;
  reason?: string;
};

export type ActionMeta =
  | { action: 'RegularAttack'; defenderIndex: number }
  | { action: 'DoubleAttack'; defenderIndex: number }
  | SessionEndedMeta
  | null;
