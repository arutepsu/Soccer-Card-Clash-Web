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
  const pushClient = createServerPushClient({
    path: '/api/ws',
    getPlayerId: () => getCurrentPlayerId(),
    getAccessToken,
  });

  const streamClient = createGameEventStream();

  const onlineApi = createOnlineGameApi({
    streamClient,
    pushClient,
    getPlayerId: () => getCurrentPlayerId(),
  });

  const localPvpApi = createLocalGameApiHttp({
    getPlayerId: () => 'local',
  });

  const practiceApi = createPracticeGameApi(practiceEngine);

  const game: GameApiRouter = {
    localPvp: localPvpApi,
    practice: practiceApi,
    online: onlineApi,

    forMode: (mode: GameMode, localKind?: LocalKind | null) => {
      if (mode === 'online') return onlineApi;
      return (localKind ?? 'pvp') === 'practice' ? practiceApi : localPvpApi;
    },
  };

  const soundManager = createSoundManager();
  const gameContext = createGameContextService(game);
  const auth = createAuthApi();

  const sessions = createSessionApi({
    getJSON: onlineApi.getJSON,
    postJSON: onlineApi.postJSON,
  });

  const isOnline = ref<boolean>(navigator.onLine);

  window.addEventListener('online', () => (isOnline.value = true));
  window.addEventListener('offline', () => (isOnline.value = false));

  let lastOnlineSid: string | null = null;

  watch(
    [gameContext.mode, gameContext.sessionId],
    ([m, sid]) => {
      if (m !== 'online') {
        lastOnlineSid = null;
        pushClient.setGameId?.(null);
        return;
      }

      const nextSid = (sid ?? '').trim() || null;
      pushClient.setGameId?.(nextSid);

      if (!nextSid) {
        lastOnlineSid = null;
        return;
      }

      if (nextSid !== lastOnlineSid) {
        lastOnlineSid = nextSid;
        pushClient.reconnect();
      }
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
