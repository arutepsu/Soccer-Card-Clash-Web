import { computed } from 'vue';
import { authState } from '@/auth/authState';
import type { WebGameState } from '@/types/WebGameState';

export function usePlayingFieldMode(
  webState: any,
  showInfoAlert: (m: string) => void,
  opts: {
    mode: any;
    localIsVsAI?: any;
    localHumanName?: any;
  }
) {
  const isLocal = computed(() => opts.mode.value === 'local');
  const isOnline = computed(() => opts.mode.value === 'online');

  const myTurn = computed(() => {
    const st = webState.value as WebGameState | null;
    if (!st) return false;

    if (isLocal.value) {
      const vsAI = !!opts.localIsVsAI?.value;

      if (!vsAI) return true;

      const human = ((opts.localHumanName?.value ?? '') as string).trim().toLowerCase();
      const attacker = (st.roles?.attacker ?? '').trim().toLowerCase();
      return !!human && attacker === human;
    }

    if (st.you) return st.you.isAttacker === true;

    const me = (authState.username ?? '').trim().toLowerCase();
    const attacker = (st.roles?.attacker ?? '').trim().toLowerCase();
    return !!me && me === attacker;
  });

  function requireMyTurn(): boolean {
    if (myTurn.value) return true;
    showInfoAlert('Not your turn (only attacker may act).');
    return false;
  }
  const cinemaActive = computed(() => {
    const st = webState.value as WebGameState | null;
    if (!st) return false;

    if (isLocal.value) {
      const vsAI = !!opts.localIsVsAI?.value;
      if (!vsAI) return false;

      return !myTurn.value;
    }

    if (st.you) return st.you.isAttacker === false;

    const me = (authState.username ?? '').trim().toLowerCase();
    const attacker = (st.roles?.attacker ?? '').trim().toLowerCase();
    return !!me && me !== attacker;
  });

  const opponentName = computed(() => {
    const st = webState.value as WebGameState | null;
    if (!st) return '';

    const a = (st.roles?.attacker ?? '').trim();
    const d = (st.roles?.defender ?? '').trim();

    if (isLocal.value) {
      const vsAI = !!opts.localIsVsAI?.value;
      if (!vsAI) return '';
      return myTurn.value ? d : a;
    }

    const me = (authState.username ?? '').trim().toLowerCase();
    return a.toLowerCase() === me ? d : a;
  });

  return {
    requireMyTurn,
    cinemaActive,
    opponentName,
  };
}
