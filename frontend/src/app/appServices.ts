// frontend/src/app/appServices.ts
import { inject, provide, type InjectionKey } from 'vue';
import { createGameApi, type GameApi } from '../api/gameApi';
import { createServerPushClient } from '../api/serverPushClient';
import { createGameEventStream } from '../api/gameEventStream';
import { createOverlay, type Overlay } from '../ui/overlay';

export interface AppServices {
  api: GameApi;
  overlay: Overlay | null;
}

export const AppServicesKey: InjectionKey<AppServices> =
  Symbol('AppServices');

export function createAppServices(): AppServices {
  const pushClient = createServerPushClient();
  const streamClient = createGameEventStream();

  const api = createGameApi({
    streamClient,
    pushClient,
  });

  const overlayHost = document.getElementById('overlay');
  const overlay = overlayHost ? createOverlay({ host: overlayHost }) : null;

  return { api, overlay };
}

export function provideAppServices(services: AppServices): void {
  provide(AppServicesKey, services);
}

export function useAppServices(): AppServices {
  const services = inject(AppServicesKey);
  if (!services) {
    throw new Error('[AppServices] AppServices not provided');
  }
  return services;
}
