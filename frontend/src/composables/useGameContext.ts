// frontend/src/composables/useGameContext.ts
import { computed, type Ref } from 'vue';
import type { WebGameState } from '../types/WebGameState';
import { useAppServices } from '../app/appServices';
import type { GameMode } from '@/app/gameContextService';

export interface GameContext {
  state: Ref<WebGameState | null>;
  hasState: Ref<boolean>;
  mode: Ref<GameMode | null>;

  setState: (next: WebGameState | null) => void;
  clear: () => void;
}

export function useGameContext(): GameContext {
  const services = useAppServices();

  return {
    state: services.gameContext.state,
    hasState: computed(() => services.gameContext.state.value != null),
    mode: services.gameContext.mode,

    setState: services.gameContext.setState,
    clear: services.gameContext.clear,
  };
}
