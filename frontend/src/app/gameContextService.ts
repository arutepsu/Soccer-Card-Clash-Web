import { ref, type Ref } from 'vue';
import type { WebGameState } from '@/types/WebGameState';
import type { StreamHandle } from '@/api/gameEventStream';
import type { GameApiRouter } from './appServices';
import { createAsyncQueue } from '@/utils/asyncQueue'

export type GameMode = 'local' | 'online';
export type LocalKind = 'pvp' | 'practice';

export interface GameContextService {
  state: Ref<WebGameState | null>;
  mode: Ref<GameMode | null>;
  sessionId: Ref<string | null>;
  lastMeta: Ref<any | null>;
  
  localPvpPlayer1: Ref<string | null>;
  localPvpPlayer2: Ref<string | null>;
  setLocalPvpNames(names: { player1?: string | null; player2?: string | null }): void;

  localIsVsAI: Ref<boolean>;
  localHumanName: Ref<string | null>;
  setLocalControl(opts: { vsAI: boolean; humanName?: string | null }): void;

  localKind: Ref<LocalKind>;
  setLocalKind(kind: LocalKind): void;

  start(nextMode: GameMode, sid?: string | null): Promise<void>;
  startOnline(sessionId: string): Promise<void>;

  startLocal(kind: LocalKind): Promise<void>;
  startPractice(): Promise<void>;

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

  const localKind = ref<LocalKind>('pvp');

  let handle: StreamHandle | null = null;
  let startToken = 0;
  let firstStreamMessage = true;

  const localPvpPlayer1 = ref<string | null>(null)
  const localPvpPlayer2 = ref<string | null>(null)

  function setLocalPvpNames(names: { player1?: string | null; player2?: string | null }) {
    const p1 = (names.player1 ?? '').trim()
    const p2 = (names.player2 ?? '').trim()
    localPvpPlayer1.value = p1 ? p1 : null
    localPvpPlayer2.value = p2 ? p2 : null
  }

  function setState(next: WebGameState | null) {
    state.value = next;
  }

  function setLocalControl(opts: { vsAI: boolean; humanName?: string | null }) {
    localIsVsAI.value = !!opts.vsAI;
    const hn = (opts.humanName ?? '').trim();
    localHumanName.value = hn ? hn : null;
  }

  function setLocalKind(next: LocalKind) {
    localKind.value = next;

    if (next === 'practice') {
      localIsVsAI.value = false;
      localHumanName.value = null;
    }
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

  const q = createAsyncQueue()

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
      if (myToken !== startToken) return

      q.enqueue(async () => {
        if (myToken !== startToken) return

        if (firstStreamMessage) {
          firstStreamMessage = false
          state.value = next
          lastMeta.value = null
          return
        }

        lastMeta.value = meta ?? null

        state.value = next

        if (meta?.action === 'Comparison' && meta?.payload && comparisonHandler) {
          void comparisonHandler(meta.payload)
        }
      })
    }, sid)


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
    const api =
      nextMode === 'local'
        ? game.forMode('local', localKind.value)
        : game.forMode('online');

      let snap: WebGameState | null = null;

      if (nextMode === 'online') {
        snap = await api.fetchGameState(sessionId.value!);
      } else {
        if (localKind.value === 'pvp' && typeof api.createLocalMultiplayer === 'function') {
          const p1 =
            (localPvpPlayer1.value ?? localHumanName.value ?? 'Player 1').trim() || 'Player 1';

          const p2 = localIsVsAI.value
            ? 'AI'
            : ((localPvpPlayer2.value ?? 'Player 2').trim() || 'Player 2');

          snap = await api.createLocalMultiplayer(p1, p2);

          if (!snap) snap = await api.getState();
        } else {
          snap = await api.getState();
        }
      }


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
        if (myToken !== startToken) return

        q.enqueue(async () => {
          if (myToken !== startToken) return

          if (firstStreamMessage) {
            firstStreamMessage = false
            state.value = next
            lastMeta.value = null
            return
          }

          lastMeta.value = meta ?? null

          state.value = next

          if (meta?.action === 'Comparison' && meta?.payload && comparisonHandler) {
            void comparisonHandler(meta.payload)
          }
        })
      }, sid)


    }
  }

  async function startLocal(kind: LocalKind): Promise<void> {
    setLocalKind(kind);
    await start('local');
  }

  async function startPractice(): Promise<void> {
    await startLocal('practice');
  }

  function clear() {
    stop();
    state.value = null;
    mode.value = null;
    sessionId.value = null;
    localPvpPlayer1.value = null
    localPvpPlayer2.value = null
    localIsVsAI.value = false;
    localHumanName.value = null;
    lastMeta.value = null;

    localKind.value = 'pvp';
  }
  
  let comparisonHandler: ((payload: any) => Promise<void>) | null = null

  return {
    state, mode, sessionId,
    lastMeta,

    localIsVsAI, localHumanName, setLocalControl,

    localKind, setLocalKind,
    localPvpPlayer1, localPvpPlayer2, setLocalPvpNames,
    start, startOnline,
    startLocal, startPractice,

    stop, setState, clear,
    setMode, setSessionId,
  };
}
