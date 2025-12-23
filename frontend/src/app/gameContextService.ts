// frontend/src/app/gameContextService.ts
import { ref, type Ref } from 'vue';
import type { WebGameState } from '@/types/WebGameState';
import type { StreamHandle } from '@/api/gameEventStream';
import type { GameApiRouter } from './appServices';

export type GameMode = 'local' | 'online';

export interface GameContextService {
  state: Ref<WebGameState | null>;
  mode: Ref<GameMode | null>;
  start(nextMode: GameMode): Promise<void>;
  stop(): void;
  setState(state: WebGameState | null): void;
  clear(): void;
  startOnlineStreamOnly(sessionId: string): void;
  setMode(nextMode: GameMode): void;
}

export function createGameContextService(game: GameApiRouter): GameContextService {
  const state = ref<WebGameState | null>(null);
  const mode = ref<GameMode | null>(null);

  let handle: StreamHandle | null = null;
  let startedForMode: GameMode | null = null;
  let startToken = 0;

  function setState(next: WebGameState | null) {
    state.value = next;
  }

  function setMode(nextMode: GameMode) {
    mode.value = nextMode;
  }

  function stop() {
    if (handle) {
      try { handle.close(); } catch (e) { console.warn('[GameContext] stop close failed', e); }
      handle = null;
    }
  }

  async function fetchSnapshot(nextMode: GameMode) {
    const api = game.forMode(nextMode);

    if (nextMode === 'online') {
      return api.fetchGameState();
    }

    return api.getState();
  }

  function startOnlineStreamOnly(sessionId: string): void {
    const myToken = ++startToken;

    stop();
    mode.value = 'online';
    startedForMode = 'online';

    const api = game.forMode('online');
    handle = api.openStream((next) => {
        if (myToken !== startToken) return;
        state.value = next;
    }, sessionId);
  }


  async function start(nextMode: GameMode): Promise<void> {
    const myToken = ++startToken;

    if (handle && startedForMode === nextMode) {
      mode.value = nextMode;

      if (!state.value) {
        try {
          const snap = await fetchSnapshot(nextMode);
          if (myToken !== startToken) return;
          state.value = (snap as WebGameState | null) ?? null;
        } catch (e) {
          console.warn('[GameContext] snapshot failed (already started)', e);
        }
      }
      return;
    }

    stop();
    mode.value = nextMode;
    startedForMode = nextMode;

    try {
      const snap = await fetchSnapshot(nextMode);
      if (myToken !== startToken) return;
      state.value = (snap as WebGameState | null) ?? null;
    } catch (e) {
      console.warn('[GameContext] snapshot failed', e);
      if (myToken !== startToken) return;
    }

    if (nextMode === 'online') {
      const api = game.forMode('online');
      handle = api.openStream((next) => {
        if (myToken !== startToken) return;
        state.value = next;
      });
    }
  }

    function clear() {
    stop();
    state.value = null;
    }


  return { state, mode, start, stop, setState, clear, startOnlineStreamOnly, setMode };
}
