// frontend/src/composables/useAttackerHand.ts
import { computed, ref, watchEffect } from 'vue';
import { useGameContext } from './useGameContext';
import { createCardImageRegistry } from '../utils/cardImageRegistry';
import { buildMapWebToScene, type EnrichedState } from '../utils/mapWebToScene';
import { HandCardLike } from '../types/HandCards';


export function useAttackerHand() {
  const gameContext = useGameContext();

  const cardRegistry = createCardImageRegistry();
  const mapWebToScene = buildMapWebToScene(cardRegistry);

  const enriched = ref<EnrichedState | null>(null);
  const selectedIndex = ref<number | null>(null);

  // Keep enriched state in sync with WebGameState
  watchEffect(() => {
    const web = gameContext.state.value;
    if (!web) {
      enriched.value = null;
      selectedIndex.value = null;
      return;
    }
    enriched.value = mapWebToScene(web);
  });

  const attacker = computed(() => enriched.value?.players?.attacker ?? null);

  const attackerHand = computed<HandCardLike[]>(() => {
    return enriched.value?.gameCards?.hands?.att ?? [];
  });

  async function init() {
    // preload card assets first, then init game state
    await cardRegistry.preloadAll().catch(() => {});
    await gameContext.init();
  }

  async function doSwap() {
    if (selectedIndex.value == null || selectedIndex.value < 0) {
      const err = new Error('NO_SELECTION');
      (err as any).code = 'NO_SELECTION';
      throw err;
    }
    await gameContext.swap(selectedIndex.value);
    selectedIndex.value = null;
  }

  async function doReverseSwap() {
    await gameContext.reverseSwap();
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
  };
}