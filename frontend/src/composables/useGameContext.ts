// frontend/src/composables/useGameContext.ts
import { ref, computed, watch, type Ref } from 'vue';
import type { WebGameState } from '../types/WebGameState';
import { useAppServices } from '../app/appServices';
import { useGameStream, type UseGameStreamOptions } from './useGameStream';


export interface GameContext {
  state: Ref<WebGameState | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;

  initialized: Ref<boolean>;
  hasState: Ref<boolean>;

  init: () => Promise<void>;

  restart: (attackerName?: string | null, defenderName?: string | null) => Promise<void>;
  singleAttackDefender: (index: number | string) => Promise<void>;
  singleAttackGoalkeeper: () => Promise<void>;
  doubleAttack: (index: number | string) => Promise<void>;
  boost: (payload: any) => Promise<void>;
  swap: (index: number | string) => Promise<void>;
  reverseSwap: () => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  executeAI: (action: any) => Promise<void>;
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

  // keep gameState in sync with the stream
  watch(
    streamState,
    (next) => {
      gameState.value = next;
    },
    { immediate: true },
  );
}


/**
 * GameContext composable: central gateway for game state + commands.
 * All components using this share the same context.
 */
export function useGameContext(): GameContext {
  const { api } = useAppServices();

  ensureStreamStarted();

  async function safeUpdate(
    fn: () => Promise<WebGameState | null>,
  ): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const next = await fn();
      if (next) {
        gameState.value = next;
      }
    } catch (err: any) {
      console.error('[useGameContext] command failed:', err);
      error.value = err?.message ?? String(err);
    } finally {
      loading.value = false;
    }
  }

async function init(): Promise<void> {
  if (initialized.value) return;

  loading.value = true;
  error.value = null;

  try {
    const next = await api.restart('Player 1', 'Player 2');
    if (next) {
      gameState.value = next;
    }
    initialized.value = true;
  } catch (err: any) {
    console.error('[useGameContext] init failed:', err);
    error.value = err?.message ?? String(err);
  } finally {
    loading.value = false;
  }
}



  return {
    state: gameState,
    loading,
    error,
    initialized,
    hasState: computed(() => gameState.value != null),

    init,

    restart(attackerName?: string | null, defenderName?: string | null) {
      return safeUpdate(() => api.restart(attackerName ?? null, defenderName ?? null));
    },

    singleAttackDefender(index: number | string) {
      return safeUpdate(() => api.singleAttackDefender(index));
    },

    singleAttackGoalkeeper() {
      return safeUpdate(() => api.singleAttackGoalkeeper());
    },

    doubleAttack(index: number | string) {
      return safeUpdate(() => api.doubleAttack(index));
    },

    boost(payload: any) {
      return safeUpdate(() => api.boost(payload));
    },

    swap(index: number | string) {
      return safeUpdate(() => api.swap(index));
    },

    reverseSwap() {
      return safeUpdate(() => api.reverseSwap());
    },

    undo() {
      return safeUpdate(() => api.undo());
    },

    redo() {
      return safeUpdate(() => api.redo());
    },

    executeAI(action: any) {
      return safeUpdate(() => api.executeAI(action));
    },
  };
}
