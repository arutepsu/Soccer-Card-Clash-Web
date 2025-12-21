// frontend/src/composables/usePlayingFieldMode.ts
import { computed, watch, type ComputedRef } from 'vue';
import { setCurrentPlayerId } from '@/app/appServices';
import type { WebGameState } from '@/types/WebGameState';

export interface PlayingFieldModeHelper {
  isOnline: ComputedRef<boolean>;
  isLocal: ComputedRef<boolean>;
  isMyTurn: ComputedRef<boolean>;
  cinemaActive: ComputedRef<boolean>;
  opponentName: ComputedRef<string>;

  requireMyTurn(): boolean;
}

/**
 * Centralizes local/online logic:
 * - online: enforce turn ownership (attacker only)
 * - local: allow actions always + keep playerId synced to current attacker
 */
export function usePlayingFieldMode(
  webState: ComputedRef<WebGameState | null>,
  showInfoAlert: (msg: string) => void,
): PlayingFieldModeHelper {
  const you = computed(() => webState.value?.you ?? null);

  const isOnline = computed(() => !!you.value);
  const isLocal = computed(() => !isOnline.value);

  const isMyTurn = computed(() => {
    if (isLocal.value) return true;
    const st = webState.value;
    const me = you.value?.username;
    if (!st?.roles?.attacker || !me) return false;
    return st.roles.attacker === me;
  });

  const cinemaActive = computed(() => isOnline.value && !isMyTurn.value);

  const opponentName = computed(() => {
    const st = webState.value;

    if (isLocal.value) return st?.roles?.defender || 'Opponent';

    const me = you.value?.username;
    if (!st?.roles || !me) return 'Opponent';
    return st.roles.attacker === me ? st.roles.defender : st.roles.attacker;
  });

  function requireMyTurn(): boolean {
    if (isLocal.value) return true;

    if (!isMyTurn.value) {
      showInfoAlert("It's not your turn.");
      return false;
    }
    return true;
  }

  watch(
    webState,
    (st) => {
      if (!st) return;
      if (st.you) return;
      const attacker = st.roles?.attacker;
      if (attacker) setCurrentPlayerId(attacker);
    },
    { immediate: true },
  );

  return {
    isOnline,
    isLocal,
    isMyTurn,
    cinemaActive,
    opponentName,
    requireMyTurn,
  };
}
