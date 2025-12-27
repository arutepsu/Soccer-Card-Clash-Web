import type { SessionDto } from '@/types/SessionDtos';

export interface SessionView {
  id: string;
  name: string;
  players: string;
  status: 'Waiting' | 'Full';
  host: string;
}

export function toSessionView(dto: SessionDto): SessionView {
  const full = dto.status === 'Full' || dto.playerCount >= 2;

  return {
    id: dto.id,
    name: dto.name,
    players: `${dto.playerCount}/2`,
    status: full ? 'Full' : 'Waiting',
    host: dto.hostName,
  };
}
