import type { WebGameState } from '@/types/WebGameState';
import type { StreamHandle } from '@/api/gameEventStream';

export interface GameApi {
  postJSON<T = unknown>(url: string, payload?: unknown): Promise<T | null>;
  getJSON<T = unknown>(url: string): Promise<T>;

  openStream(
    onState: (state: WebGameState, meta?: any | null) => void,
    sid?: string | null
  ): StreamHandle;

  fetchGameState(sid?: string | null): Promise<WebGameState>;
  getState(sid?: string | null): Promise<WebGameState | null>;

  createLocalMultiplayer(attackerName: string, defenderName: string): Promise<WebGameState | null>;
  restart(attackerName?: string | null, defenderName?: string | null): Promise<WebGameState | null>;

  singleAttackDefender(index: number | string, sid?: string | null): Promise<WebGameState | null>;
  singleAttackGoalkeeper(sid?: string | null): Promise<WebGameState | null>;
  doubleAttack(index: number | string, sid?: string | null): Promise<WebGameState | null>;
  boost(payload: any, sid?: string | null): Promise<WebGameState | null>;
  swap(index: number | string, sid?: string | null): Promise<WebGameState | null>;
  reverseSwap(sid?: string | null): Promise<WebGameState | null>;
  undo(sid?: string | null): Promise<WebGameState | null>;
  redo(sid?: string | null): Promise<WebGameState | null>;
  executeAI(action: any, sid?: string | null): Promise<WebGameState | null>;
}
