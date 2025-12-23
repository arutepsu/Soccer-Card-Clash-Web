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

type Mode = 'local' | 'online' | null;

export function usePlayingFieldMode(
  webState: ComputedRef<WebGameState | null>,
  showInfoAlert: (msg: string) => void,
  opts?: { mode?: ComputedRef<Mode>; myUsername?: ComputedRef<string | null> },
): PlayingFieldModeHelper {
  const modeRef = opts?.mode ?? computed<Mode>(() => null);
  const myUsername = opts?.myUsername ?? computed(() => null);

  const isOnline = computed(() => modeRef.value === 'online');
  const isLocal  = computed(() => modeRef.value === 'local');

  watch(
    [webState, isLocal],
    ([st, local]) => {
      if (!local) return;
      const attacker = st?.roles?.attacker?.trim();
      if (attacker) setCurrentPlayerId(attacker);
    },
    { immediate: true },
  );

  const isMyTurn = computed(() => {
    if (isLocal.value) return true;
    const st = webState.value;
    const me = myUsername.value;
    if (!st?.roles?.attacker || !me) return false;
    return st.roles.attacker === me;
  });

  const cinemaActive = computed(() => isOnline.value && !isMyTurn.value);

  const opponentName = computed(() => {
    const st = webState.value;
    if (!st?.roles) return 'Opponent';

    if (isLocal.value) return st.roles.defender || 'Opponent';

    const me = myUsername.value;
    if (!me) return 'Opponent';
    return st.roles.attacker === me
      ? (st.roles.defender || 'Opponent')
      : (st.roles.attacker || 'Opponent');
  });

  function requireMyTurn(): boolean {
    if (isLocal.value) return true;
    if (!isMyTurn.value) {
      showInfoAlert("It's not your turn.");
      return false;
    }
    return true;
  }

  return { isOnline, isLocal, isMyTurn, cinemaActive, opponentName, requireMyTurn };
}
