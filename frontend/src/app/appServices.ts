// frontend/src/app/appServices.ts
import { inject, type InjectionKey, ref, watch } from 'vue';

import type { GameApi } from '@/api/GameApi';
import { createOnlineGameApi } from '@/api/onlineGameApi';
import { createLocalGameApiHttp } from '@/api/localGameApiHttp';
import { createPracticeGameApi } from '@/api/practiceGameApi';

import { createServerPushClient, type PushClient } from '@/api/serverPushClient';
import { createGameEventStream } from '@/api/gameEventStream';
import { createSoundManager, type SoundManager } from '@/utils/soundManager';
import { createSessionApi, type SessionApi } from '@/api/sessionApi';
import { createAuthApi, type AuthApi } from '@/api/authApi';

import { createGameContextService } from './gameContextService';
import type { GameContextService, GameMode, LocalKind } from './gameContextService';

import { practiceEngine } from '@/pwa/practiceEngine';
import { getAccessToken } from '@/auth/token';
import { apiGetJSON, apiPostJSON } from '@/api/apiClient'

export interface GameApiRouter {
  localPvp: GameApi;
  practice: GameApi;
  online: GameApi;

  forMode(mode: GameMode, localKind?: LocalKind | null): GameApi;
}

export interface AppServices {
  game: GameApiRouter;
  push: PushClient;

  auth: AuthApi;
  sessions: SessionApi;

  soundManager: SoundManager | null;
  gameContext: GameContextService;

  net: {
    isOnline: import('vue').Ref<boolean>;
  };
}

let currentPlayerId = '';
export function setCurrentPlayerId(id: string) {
  currentPlayerId = (id ?? '').trim();
}
export function getCurrentPlayerId(): string | null {
  const s = (currentPlayerId ?? '').trim();
  return s ? s : null;
}

export const AppServicesKey: InjectionKey<AppServices> = Symbol('AppServices');

export function createAppServices(): AppServices {
  const isOnline = ref<boolean>(navigator.onLine);

  window.addEventListener('online', () => (isOnline.value = true));
  window.addEventListener('offline', () => (isOnline.value = false));

  const localPvpApi = createLocalGameApiHttp({
    getPlayerId: () => 'local',
  });

  const practiceApi = createPracticeGameApi(practiceEngine);

  const sessions: SessionApi = isOnline.value
    ? createSessionApi({ getJSON: apiGetJSON, postJSON: apiPostJSON })
    : ({
        async getPlayerToken() { return null; },
      } as any);

  const pushClient: PushClient = isOnline.value
    ? createServerPushClient({
        path: '/api/ws',
        getPlayerId: () => getCurrentPlayerId(),
        getAccessToken,
        getPlayerToken: (sid) => (sid ? sessions.getPlayerToken(sid) : null),
      })
    : ({
        reconnect() {},
        close() {},
        setGameId() {},
      } as any);

  const streamClient = isOnline.value
    ? createGameEventStream()
    : ({
        open() {
          return { type: 'none' as const, close() {} };
        },
      } as any);

  const onlineApi: GameApi = isOnline.value
    ? createOnlineGameApi({
        streamClient,
        pushClient,
        getPlayerId: () => getCurrentPlayerId(),
      })
    : ({
        openStream() { return { type: 'none' as const, close() {} }; },
        async fetchGameState() { return practiceApi.fetchGameState(); },
        async getState() { return practiceApi.getState(); },
      } as any);

  const game: GameApiRouter = {
    localPvp: localPvpApi,
    practice: practiceApi,
    online: onlineApi,

    forMode: (mode: GameMode, localKind?: LocalKind | null) => {
      if (!isOnline.value) return practiceApi;

      if (mode === 'online') return onlineApi;
      return (localKind ?? 'pvp') === 'practice' ? practiceApi : localPvpApi;
    },
  };

  const soundManager = createSoundManager();
  soundManager.preload('attack', 'attack.wav');
  soundManager.preload('hover', 'hover.wav');

  const gameContext = createGameContextService(game);
  const auth = createAuthApi();

  let lastOnlineSid: string | null = null;

  watch(
    [gameContext.mode, gameContext.sessionId, isOnline],
    ([m, sid, on]) => {
      if (!on || m !== 'online') {
        lastOnlineSid = null;
        try { pushClient.setGameId?.(null); } catch {}
        return;
      }

      const nextSid = (sid ?? '').trim() || null;
      pushClient.setGameId?.(nextSid);
      lastOnlineSid = nextSid;
    },
    { immediate: true },
  );

  watch(isOnline, (on) => {
    if (!on && gameContext.mode.value === 'online') {
      try {
        gameContext.stop();
      } catch {}
    }
  });

  return {
    game,
    push: pushClient,
    auth,
    sessions,
    soundManager,
    gameContext,
    net: { isOnline },
  };
}

export function useAppServices(): AppServices {
  const services = inject(AppServicesKey);
  if (!services) throw new Error('[AppServices] AppServices not provided');
  return services;
}
