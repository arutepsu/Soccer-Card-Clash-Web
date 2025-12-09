// frontend/src/composables/useAttackerDefenders.ts
import { ref, computed } from 'vue';
import { useGameContext } from './useGameContext';
import { useGameCommands } from './useGameCommands';
import type { WebGameState } from '../types/WebGameState';
import type {
  FieldCardLike,
  SlotLike,
  FieldSlot,
  FieldCardData,
} from '../types/FieldCards';
import type { SelectedTarget } from '../types/AttackerDefenders';

import { createCardImageRegistry } from '../utils/cardImageRegistry';
import { buildMapFieldToScene } from '../utils/mapFieldToScene';

// create registry once for this module
const cardRegistry = createCardImageRegistry();
const mapFieldToScene = buildMapFieldToScene(cardRegistry);

export function useAttackerDefenders() {
  const gameContext = useGameContext();
  const { boost: sendBoost, busy } = useGameCommands();

  const web = computed<WebGameState | null>(() => gameContext.state.value);

  function mergeBoostMeta(base: any, boostedSource: any | null | undefined): any {
    if (!boostedSource) return base;

    const src: any = boostedSource;

    const boostMeta: any = {};
    if (src.isBoosted != null) boostMeta.isBoosted = src.isBoosted;
    if (src.boosted != null) boostMeta.boosted = src.boosted;
    if (src.kind != null) boostMeta.kind = src.kind;
    if (src.type != null) boostMeta.type = src.type;
    if (src.cardType != null) boostMeta.cardType = src.cardType;

    return { ...base, ...boostMeta };
  }

  function toFieldSlot(
    src: FieldCardLike | null | undefined,
    idx: number | string,
    boostSourceCard?: FieldCardData | null,
  ): SlotLike {
    if (!src) return null;

    const anySrc = src as any;

    // src.img already produced by mapFieldToScene using cardRegistry
    const baseCard: any = {
      // keep whatever img / flags mapFieldToScene gave us
      img: anySrc.img,
      isDefeated: anySrc.isDefeated,
    };

    const mergedCard: FieldCardData | null = mergeBoostMeta(
      baseCard,
      boostSourceCard,
    ) as FieldCardData;

    const slot: FieldSlot = {
      id: anySrc.id ?? `att-${idx}`,
      card: mergedCard,
    };

    return slot;
  }

  const defenders = computed<SlotLike[]>(() => {
    const w = web.value;
    if (!w) return [];

    const scene = mapFieldToScene(w);
    const anyScene = scene as any;

    const rawDefenders: FieldCardLike[] = scene.defenders ?? [];

    const fieldSlots: FieldSlot[] =
      anyScene?.cards?.defenderField ??
      anyScene?.gameCards?.field?.defenders ??
      anyScene?.gameCards?.defenderField ??
      [];

    return rawDefenders.map((raw, index) => {
      const boostSourceCard = fieldSlots[index]?.card ?? null;
      return toFieldSlot(raw, index, boostSourceCard);
    });
  });

  const goalkeeper = computed<SlotLike | null>(() => {
    const w = web.value;
    if (!w) return null;

    const scene = mapFieldToScene(w);
    const anyScene = scene as any;

    const raw = scene.goalkeeper as FieldCardLike | null | undefined;
    if (!raw) return null;

    const fieldGkSlot: FieldSlot | null =
      anyScene?.cards?.defenderGoalkeeper ??
      anyScene?.gameCards?.field?.goalkeeper ??
      anyScene?.gameCards?.defenderGoalkeeper ??
      null;

    const boostSourceCard = (fieldGkSlot?.card ?? null) as FieldCardData | null;

    return toFieldSlot(raw, 'gk', boostSourceCard);
  });

  const selectedTarget = ref<SelectedTarget | null>(null);

  const canBoost = computed<boolean>(() => {
    const st = web.value as any;
    const lim = st?.allowed?.attacker ?? {};
    return Number(lim?.boostRemaining) > 0;
  });

  async function init(): Promise<void> {
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

    await sendBoost(payload);
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
    busy,
  };
}
