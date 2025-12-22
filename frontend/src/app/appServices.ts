// frontend/src/app/appServices.ts
import { inject, type InjectionKey } from 'vue';

import { createGameApi, type GameApi } from '../api/gameApi';
import { createServerPushClient, type PushClient } from '../api/serverPushClient';
import { createGameEventStream } from '../api/gameEventStream';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import { createSessionApi, type SessionApi } from '../api/sessionApi';
import { createAuthApi, type AuthApi } from '../api/authApi';

import { createGameContextService } from './gameContextService';
import type { GameContextService, GameMode } from './gameContextService';

export interface GameApiRouter {
  local: GameApi;
  online: GameApi;
  forMode(mode: GameMode): GameApi;
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

export function createAppServices(): AppServices {
  const pushClient = createServerPushClient({
    path: '/api/ws',
    getPlayerId: () => null,
  });
  const streamClient = createGameEventStream();

  const localApi = createGameApi({
    mode: 'local',
    getPlayerId: () => getCurrentPlayerId(),
  });

  const onlineApi = createGameApi({
    mode: 'online',
    streamClient,
    pushClient,
    getPlayerId: () => null,
  });

  const game: GameApiRouter = {
    local: localApi,
    online: onlineApi,
    forMode: (mode: GameMode) => (mode === 'online' ? onlineApi : localApi),
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