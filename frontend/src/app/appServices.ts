// app/appServices.ts
import { ref, type Ref, inject, type InjectionKey } from 'vue';
import { createGameApi, type GameApi } from '../api/gameApi';
import { createServerPushClient, type PushClient } from '../api/serverPushClient';
import { createGameEventStream } from '../api/gameEventStream';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import type { WebGameState } from '../types/WebGameState';
import { createSessionApi, type SessionApi } from '../api/sessionApi';
import { createAuthApi, type AuthApi } from '../api/authApi';
import type { StreamHandle } from '../api/gameEventStream';

export interface GameApiRouter {
  local: GameApi;
  online: GameApi;

  forMode(mode: GameMode): GameApi;
}

type GameMode = 'local' | 'online';

export interface GameContextService {
  state: Ref<WebGameState | null>;
  mode: Ref<GameMode | null>;
  start(mode: GameMode): Promise<void>;
  stop(): void;
  setState(state: WebGameState | null): void;
  clear(): void;
}


export interface AppServices {
  game: GameApiRouter;
  push: PushClient;

  auth: AuthApi;
  sessions: SessionApi;

  soundManager: SoundManager | null;
  gameContext: GameContextService;
}

let currentPlayerId = 'frontend';
export function setCurrentPlayerId(id: string) {
  currentPlayerId = id;
}

export function getCurrentPlayerId(): string {
  return currentPlayerId;
}

export const AppServicesKey: InjectionKey<AppServices> = Symbol('AppServices');

function createGameContextService(game: GameApiRouter): GameContextService {
  const state = ref<WebGameState | null>(null);
  const mode = ref<GameMode | null>(null);

  let handle: StreamHandle | null = null;
  let startedForMode: GameMode | null = null;
  let startToken = 0;

  function setState(newState: WebGameState | null) {
    state.value = newState;
  }

  function stop() {
    if (handle) {
      try { handle.close(); } catch (e) {
        console.warn('[GameContext] stop: handle.close failed', e);
      }
      handle = null;
    }
    startedForMode = null;
    mode.value = null;
  }

  async function start(nextMode: GameMode): Promise<void> {
    const myToken = ++startToken;
    const api = game.forMode(nextMode);

    mode.value = nextMode;

    if (handle && startedForMode === nextMode) {
      if (!state.value) {
        try {
          const snap = await api.fetchGameState();
          if (myToken !== startToken) return;
          state.value = snap;
        } catch (e) {
          console.warn('[GameContext] fetchGameState failed (already started)', e);
        }
      }
      return;
    }

    stop();
    mode.value = nextMode;
    startedForMode = nextMode;

    try {
      const snap = await api.fetchGameState();
      if (myToken !== startToken) return;
      state.value = snap;
    } catch (e) {
      console.warn('[GameContext] fetchGameState failed:', e);
      if (myToken !== startToken) return;
      state.value = null;
    }

    handle = api.openStream((next) => {
      if (myToken !== startToken) return;
      state.value = next;
    });
  }


  function clear() {
    state.value = null;
  }

  return { state, mode, start, stop, setState, clear };
}


export function createAppServices(): AppServices {
  const pushClient = createServerPushClient({
    path: '/api/ws',
    getPlayerId: () => currentPlayerId,
  });
  const streamClient = createGameEventStream();

  const localApi = createGameApi({
    mode: 'local',
    streamClient,
    getPlayerId: () => getCurrentPlayerId(),
  });

  const onlineApi = createGameApi({
    mode: 'online',
    streamClient,
    pushClient,
    getPlayerId: () => getCurrentPlayerId(),
  });

  const game: GameApiRouter = {
    local: localApi,
    online: onlineApi,
    forMode: (mode) => (mode === 'online' ? onlineApi : localApi),
  };

  const soundManager = createSoundManager();
  const gameContext = createGameContextService(game);
  const auth = createAuthApi();

  const sessions = createSessionApi({
    getJSON: onlineApi.getJSON,
    postJSON: onlineApi.postJSON,
  });

  return {
    game,
    push: pushClient,
    auth,
    sessions,
    soundManager,
    gameContext,
  };
}

export function useAppServices(): AppServices {
  const services = inject(AppServicesKey);
  if (!services) throw new Error('[AppServices] AppServices not provided');
  return services;
}
