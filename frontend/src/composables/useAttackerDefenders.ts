// frontend/src/composables/useAttackerDefenders.ts
import { ref, computed } from 'vue';
import { useGameContext } from './useGameContext';
import type { WebGameState } from '../types/WebGameState';
import type { FieldCardLike } from '../types/FieldCards';
import type { SelectedTarget } from '../types/AttackerDefenders';

import { createCardImageRegistry } from '../utils/cardImageRegistry';
import { buildMapFieldToScene } from '../utils/mapFieldToScene';

// create registry once for this module
const cardRegistry = createCardImageRegistry();
const mapFieldToScene = buildMapFieldToScene(cardRegistry);

export function useAttackerDefenders() {
  const gameContext = useGameContext();

  const web = computed<WebGameState | null>(() => gameContext.state.value);

  const defenders = computed<FieldCardLike[]>(() => {
    const { defenders } = mapFieldToScene(web.value);
    return defenders;
  });

  const goalkeeper = computed<FieldCardLike | null>(() => {
    const { goalkeeper } = mapFieldToScene(web.value);
    return goalkeeper;
  });

  const selectedTarget = ref<SelectedTarget | null>(null);

  const canBoost = computed<boolean>(() => {
    const st = web.value as any;
    const lim = st?.allowed?.attacker ?? {};
    return Number(lim?.boostRemaining) > 0;
  });

  async function init(): Promise<void> {
    // mirror what you did for hands: preload card images first
    await cardRegistry.preloadAll().catch(() => {});
    await gameContext.init();
  }

  async function doBoost(): Promise<void> {
    if (!canBoost.value) {
      const err: any = new Error('Boost not available');
      err.code = 'BOOST_NOT_AVAILABLE';
      throw err;
    }

    if (!selectedTarget.value) {
      const err: any = new Error('No target selected');
      err.code = 'NO_TARGET_SELECTED';
      throw err;
    }

    const target = selectedTarget.value;

    const payload =
      target.kind === 'defender'
        ? { target: 'defender', index: target.index }
        : { target: 'goalkeeper' };

    await gameContext.boost(payload);
    selectedTarget.value = null;
  }

  return {
    gameContext,
    web,
    defenders,
    goalkeeper,
    selectedTarget,
    canBoost,
    init,
    doBoost,
  };
}
