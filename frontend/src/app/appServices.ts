// app/appServices.ts
import { ref, type Ref, inject, provide, type InjectionKey } from 'vue';
import { createGameApi, type GameApi } from '../api/gameApi';
import { createServerPushClient } from '../api/serverPushClient';
import { createGameEventStream } from '../api/gameEventStream';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import type { WebGameState } from '../types/WebGameState';

export interface GameContextService {
  state: Ref<WebGameState | null>;
  setState(state: WebGameState | null): void;
  clear(): void;
}

export interface AppServices {
  api: GameApi;
  soundManager: SoundManager | null;
  gameContext: GameContextService;
}

let currentPlayerId = 'frontend';
export function setCurrentPlayerId(id: string) {
  currentPlayerId = id;
}

export const AppServicesKey: InjectionKey<AppServices> =
  Symbol('AppServices');

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

export function createAppServices(): AppServices {
  const pushClient = createServerPushClient({
    getPlayerId: () => currentPlayerId,
  });
  const streamClient = createGameEventStream();
  const api = createGameApi({ streamClient, pushClient });
  const soundManager = createSoundManager();
  const gameContext = createGameContextService();

  return { api, soundManager, gameContext };
}

export function useAppServices(): AppServices {
  const services = inject(AppServicesKey);
  if (!services) throw new Error('[AppServices] AppServices not provided');
  return services;
}

