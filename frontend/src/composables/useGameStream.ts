// frontend/src/composables/useGameStream.ts
import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import type { WebGameState } from '../types/WebGameState';
import type { StreamHandle } from '../api/gameEventStream';
import { useAppServices } from '../app/appServices';

export interface UseGameStreamOptions {
  autoStart?: boolean;
}

/**
 * Handles SSE/Comet-like streaming of WebGameState via api.openStream.
 * Returns a reactive state ref and control methods.
 */
export function useGameStream(
  options: UseGameStreamOptions = {},
): {
  state: Ref<WebGameState | null>;
  start: () => void;
  stop: () => void;
} {
  const { api } = useAppServices();

  const state = ref<WebGameState | null>(null);
  let handle: StreamHandle | null = null;

  const autoStart = options.autoStart ?? true;

  function start(): void {
    if (handle) return;

    console.log('[useGameStream] starting stream');
    handle = api.openStream((nextState) => {
      console.log('[useGameStream] received state from stream:', nextState);
      state.value = nextState;
    });
  }

  function stop(): void {
    if (handle) {
      try {
        handle.close();
      } catch (err) {
        console.warn('[useGameStream] handle.close() failed:', err);
      }
      handle = null;
    }
  }

  onMounted(() => {
    if (autoStart) {
      start();
    }
  });

  onUnmounted(() => {
    stop();
  });

  return { state, start, stop };
}

export {};
