// frontend/src/composables/useAttackerHand.ts
import { computed, ref, watchEffect } from 'vue';
import { useGameContext } from './useGameContext';
import { useGameCommands } from './useGameCommands';
import { createCardImageRegistry } from '../utils/cardImageRegistry';
import { buildHandToScene, type EnrichedState } from '../utils/mapHandToScene';
import type { HandCardLike } from '../types/HandCards';

export function useAttackerHand() {
  const gameContext = useGameContext();
  const { swap: sendSwap, reverseSwap: sendReverseSwap, busy } = useGameCommands();

  const cardRegistry = createCardImageRegistry();
  const mapHandToScene = buildHandToScene(cardRegistry);

  const enriched = ref<EnrichedState | null>(null);
  const selectedIndex = ref<number | null>(null);

  watchEffect(() => {
    const web = gameContext.state.value;
    if (!web) {
      enriched.value = null;
      selectedIndex.value = null;
      return;
    }
    enriched.value = mapHandToScene(web);
  });

  const attacker = computed(() => enriched.value?.players?.attacker ?? null);

  const attackerHand = computed<HandCardLike[]>(() => {
    return enriched.value?.gameCards?.hands?.att ?? [];
  });

  async function init() {
    await cardRegistry.preloadAll().catch(() => {});
    await gameContext.init();
  }

  async function doSwap() {
    if (selectedIndex.value == null || selectedIndex.value < 0) {
      const err = new Error('NO_SELECTION');
      (err as any).code = 'NO_SELECTION';
      throw err;
    }
    await sendSwap(selectedIndex.value);
    selectedIndex.value = null;
  }

  async function doReverseSwap() {
    await sendReverseSwap();
  }

  return {
    gameContext,
    enriched,
    attacker,
    attackerHand,
    selectedIndex,
    init,
    doSwap,
    doReverseSwap,
    busy,
  };
}
