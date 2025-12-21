// app/appServices.ts
import { ref, type Ref, inject, type InjectionKey } from 'vue';
import { createGameApi, type GameApi } from '../api/gameApi';
import { createServerPushClient, type PushClient } from '../api/serverPushClient';
import { createGameEventStream } from '../api/gameEventStream';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import type { WebGameState } from '../types/WebGameState';
import { createSessionApi, type SessionApi } from '../api/sessionApi';
import { createAuthApi, type AuthApi } from '../api/authApi';

type GameMode = 'local' | 'online';

export interface GameApiRouter {
  local: GameApi;
  online: GameApi;

  forMode(mode: GameMode): GameApi;

  forRouteName(name: unknown): GameApi;
}

export interface GameContextService {
  state: Ref<WebGameState | null>;
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

function createGameContextService(): GameContextService {
  const state = ref<WebGameState | null>(null);

  function setState(newState: WebGameState | null) {
    state.value = newState;
  }

  function clear() {
    state.value = null;
  }

  return { state, setState, clear };
}

const ONLINE_ROUTE_NAMES = new Set<string>(['SessionView']);

function modeForRouteName(name: unknown): GameMode {
  const key = typeof name === 'string' ? name : '';
  return ONLINE_ROUTE_NAMES.has(key) ? 'online' : 'local';
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
    forRouteName: (name) => {
      const mode = modeForRouteName(name);
      return mode === 'online' ? onlineApi : localApi;
    },
  };

  const soundManager = createSoundManager();
  const gameContext = createGameContextService();
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
