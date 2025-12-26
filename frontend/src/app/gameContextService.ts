// frontend/src/app/gameContextService.ts
import { ref, type Ref } from 'vue';
import type { WebGameState } from '@/types/WebGameState';
import type { StreamHandle } from '@/api/gameEventStream';
import type { GameApiRouter } from './appServices';

export type GameMode = 'local' | 'online';

export interface GameContextService {
  state: Ref<WebGameState | null>;
  mode: Ref<GameMode | null>;
  sessionId: Ref<string | null>;
  lastMeta: Ref<any | null>;
  localIsVsAI: Ref<boolean>;
  localHumanName: Ref<string | null>;
  setLocalControl(opts: { vsAI: boolean; humanName?: string | null }): void;

  start(nextMode: GameMode, sid?: string | null): Promise<void>;
  startOnline(sessionId: string): Promise<void>;

  stop(): void;
  setState(state: WebGameState | null): void;
  clear(): void;

  setMode(nextMode: GameMode): void;
  setSessionId(id: string | null): void;
}

export function createGameContextService(game: GameApiRouter): GameContextService {
  const state = ref<WebGameState | null>(null);
  const mode = ref<GameMode | null>(null);
  const sessionId = ref<string | null>(null);
  const lastMeta = ref<any | null>(null);
  const localIsVsAI = ref(false);
  const localHumanName = ref<string | null>(null);

  let handle: StreamHandle | null = null;
  let startToken = 0;

  let firstStreamMessage = true;


  function setState(next: WebGameState | null) {
    state.value = next;
  }

  function setLocalControl(opts: { vsAI: boolean; humanName?: string | null }) {
    localIsVsAI.value = !!opts.vsAI;
    const hn = (opts.humanName ?? '').trim();
    localHumanName.value = hn ? hn : null;
  }

  function setMode(nextMode: GameMode) {
    mode.value = nextMode;
    if (nextMode !== 'online') sessionId.value = null;
  }

  function setSessionId(id: string | null) {
    sessionId.value = id;
  }

  function stop() {
    if (handle) {
      try { handle.close(); } catch (e) { console.warn('[GameContext] stop close failed', e); }
      handle = null;
    }
    lastMeta.value = null;

    firstStreamMessage = true;
  }

  async function startOnline(id: string): Promise<void> {
    const sid = (id ?? '').trim();
    if (!sid) throw new Error('[GameContext] startOnline: sessionId is required');

    const myToken = ++startToken;

    stop();
    mode.value = 'online';
    sessionId.value = sid;

    const api = game.forMode('online');

    try {
      const snap = await api.fetchGameState(sid);
      if (myToken !== startToken) return;
      state.value = snap ?? null;
    } catch (e) {
      console.warn('[GameContext] online snapshot failed', e);
      if (myToken !== startToken) return;
    }

    firstStreamMessage = true;

    handle = api.openStream((next, meta) => {
      if (myToken !== startToken) return;

      state.value = next;
      
      const action = meta?.action;
      if (action === 'RegularAttack' || action === 'DoubleAttack') {
        lastMeta.value = meta;
      } else {
        lastMeta.value = null;
      }
    }, sid);
  }

  async function start(nextMode: GameMode, sid?: string | null): Promise<void> {
    const myToken = ++startToken;

    stop();
    mode.value = nextMode;

    if (nextMode === 'online') {
      const id = (sid ?? sessionId.value ?? '').trim();
      if (!id) throw new Error('[GameContext] start(online): sessionId is required');
      sessionId.value = id;
    } else {
      sessionId.value = null;
    }

    try {
      const api = game.forMode(nextMode);
      const snap =
        nextMode === 'online'
          ? await api.fetchGameState(sessionId.value!)
          : await api.getState();

      if (myToken !== startToken) return;
      state.value = (snap as WebGameState | null) ?? null;
    } catch (e) {
      console.warn('[GameContext] snapshot failed', e);
      if (myToken !== startToken) return;
    }

    if (nextMode === 'online') {
      const api = game.forMode('online');
      const id = sessionId.value!;
      firstStreamMessage = true;

      handle = api.openStream((next, meta) => {
        if (myToken !== startToken) return;
        state.value = next;

        if (firstStreamMessage) {
          firstStreamMessage = false;
          lastMeta.value = null;
          return;
        }

        lastMeta.value = meta ?? null;
      }, id);
    }
  }

  function clear() {
    stop();
    state.value = null;
    mode.value = null;
    sessionId.value = null;

    localIsVsAI.value = false;
    localHumanName.value = null;
    lastMeta.value = null;
  }

  return {
    state, mode, sessionId,
    lastMeta,
    localIsVsAI, localHumanName, setLocalControl,
    start, startOnline,
    stop, setState, clear,
    setMode, setSessionId,
  };
}
