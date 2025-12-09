// frontend/src/composables/useGameContext.ts
import { ref, computed, watch, type Ref } from 'vue';
import type { WebGameState } from '../types/WebGameState';
import { useGameStream } from './useGameStream';

export interface GameContext {
  state: Ref<WebGameState | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;

  initialized: Ref<boolean>;
  hasState: Ref<boolean>;

  init: () => Promise<void>;
  setState: (next: WebGameState | null) => void;
}

// module-level singleton state
const gameState = ref<WebGameState | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const initialized = ref(false);

// ensure game stream is started exactly once per app
let streamStarted = false;

function ensureStreamStarted() {
  if (streamStarted) return;
  streamStarted = true;

  const { state: streamState } = useGameStream({ autoStart: true });

  // keep gameState in sync with the stream (e.g. spectators / async updates)
  watch(
    streamState,
    (next) => {
      if (next) {
        gameState.value = next;
      }
    },
    { immediate: true },
  );
}

/**
 * GameContext composable: central gateway for shared game state.
 * All components using this share the same state.
 * (Commands are handled separately in useGameCommands.)
 */
export function useGameContext(): GameContext {
  async function init(): Promise<void> {
    if (initialized.value) return;

    loading.value = true;
    error.value = null;

    try {
      // Just start the stream; game creation is done elsewhere
      ensureStreamStarted();
      initialized.value = true;
    } catch (err: any) {
      console.error('[useGameContext] init failed:', err);
      error.value = err?.message ?? String(err);
    } finally {
      loading.value = false;
    }
  }

  function setState(next: WebGameState | null): void {
    gameState.value = next;
  }

  return {
    state: gameState,
    loading,
    error,
    initialized,
    hasState: computed(() => gameState.value != null),

    init,
    setState,
  };
}
