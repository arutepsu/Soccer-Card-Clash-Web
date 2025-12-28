// frontend/src/api/practiceGameApi.ts
import type { GameApi } from '@/api/GameApi';
import type { WebGameState } from '@/types/WebGameState';

export interface PracticeEngine {
  createGame(p1: string, p2: string): WebGameState;
  dispatch(state: WebGameState, cmd: any): WebGameState;
}

export function createPracticeGameApi(engine: PracticeEngine): GameApi {
  let state: WebGameState | null = null;

  function ensureState(): WebGameState {
    if (!state) state = engine.createGame('You', 'PracticeBot');
    return state;
  }

  return {
    async postJSON() {
      throw new Error('[PracticeGameApi] postJSON not supported');
    },
    async getJSON() {
      throw new Error('[PracticeGameApi] getJSON not supported');
    },

    openStream() {
      return { type: 'none' as const, close() {} };
    },

    async fetchGameState() {
      return ensureState();
    },

    async getState() {
      return ensureState();
    },

    async createLocalMultiplayer(attackerName: string, defenderName: string) {
      state = engine.createGame(attackerName, defenderName);
      return state;
    },

    async restart(attackerName?: string | null, defenderName?: string | null) {
      const p1 = (attackerName ?? '').trim();
      const p2 = (defenderName ?? '').trim();
      if (!p1 || !p2) throw new Error('[PracticeGameApi] restart requires both names');
      state = engine.createGame(p1, p2);
      return state;
    },

    async singleAttackDefender(index: number | string) {
      const idx = Number(index);
      if (!Number.isInteger(idx)) throw new Error(`[PracticeGameApi] invalid index ${index}`);
      state = engine.dispatch(ensureState(), { type: 'RegularAttack', target: 'defender', index: idx });
      return state;
    },

    async singleAttackGoalkeeper() {
      state = engine.dispatch(ensureState(), { type: 'RegularAttack', target: 'goalkeeper' });
      return state;
    },

    async doubleAttack() { throw new Error('[PracticeGameApi] DoubleAttack not supported'); },
    async boost() { throw new Error('[PracticeGameApi] Boost not supported'); },
    async swap() { throw new Error('[PracticeGameApi] Swap not supported'); },
    async reverseSwap() { throw new Error('[PracticeGameApi] ReverseSwap not supported'); },
    async undo() { throw new Error('[PracticeGameApi] Undo not supported'); },
    async redo() { throw new Error('[PracticeGameApi] Redo not supported'); },
    async executeAI() { throw new Error('[PracticeGameApi] ExecuteAI not supported'); },
  } as any;
}
