<!-- frontend/src/components/PlayersField.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SceneView } from '../../utils/playingField/sceneMapping';
import type { FieldSlot, FieldCardData } from '../../types/FieldCards';
import FieldCardRow from './FieldCardRow.vue';
import { createCardImageRegistry } from '@/utils/cardImageRegistry';

type SlotLike = FieldSlot | FieldCardData | null | undefined;
const cardRegistry = createCardImageRegistry(); 
const props = withDefaults(
  defineProps<{
    scene: SceneView | null;
    busy?: boolean;
  }>(),
  {
    busy: false,
  },
);

const emit = defineEmits<{
  (e: 'defender-selected', index: number | null): void;
  (e: 'goalkeeper-selected', selected: boolean): void;
}>();

function withImg(slot: SlotLike): SlotLike {
  if (!slot) return slot;

  const anySlot: any = slot;

  const card: any = 'card' in anySlot ? anySlot.card : anySlot;
  if (!card) return slot;

  const fileName: string | undefined = card.fileName;
  if (!fileName) return slot;

  if (!card.img) {
    card.img = cardRegistry.getImageForCard(fileName);
  }

  if ('card' in anySlot) {
    return {
      ...anySlot,
      card: { ...card },
    } as FieldSlot;
  }

  return { ...card } as FieldCardData;
}


function defenderSlotsOf(scene: SceneView | null): SlotLike[] {
  const anyScene = scene as any;
  const slots: any[] =
    anyScene?.cards?.defenderField ??
    anyScene?.gameCards?.field?.defenders ??
    anyScene?.gameCards?.defenderField ??
    [];

  const padded = [...slots];
  while (padded.length < 3) {
    padded.push({ id: `pad-${padded.length}`, card: null });
  }

  return padded.map((s) => withImg(s));
}

function goalkeeperSlotOf(scene: SceneView | null): SlotLike | null {
  const anyScene = scene as any;
  const gkSlot =
    anyScene?.cards?.defenderGoalkeeper ??
    anyScene?.gameCards?.field?.goalkeeper ??
    anyScene?.gameCards?.defenderGoalkeeper ??
    null;

  if (!gkSlot) return null;

  return withImg(gkSlot);
}


const defenders = computed<SlotLike[]>(() => defenderSlotsOf(props.scene));
const goalkeeper = computed<SlotLike | null>(() =>
  goalkeeperSlotOf(props.scene),
);

function hasLiveDefender(slot: SlotLike): boolean {
  if (!slot) return false;

  if (typeof slot === 'object' && 'card' in slot) {
    const card = (slot as FieldSlot).card as any;
    if (!card) return false;

    if (card.isDefeated || card.defeated) return false;

    return !!card.fileName;
  }

  const card = slot as any;
  if (card.isDefeated || card.defeated) return false;
  return !!card.fileName;
}

const canSelectGoalkeeper = computed(() => {
  const result = defenders.value.every((slot) => !hasLiveDefender(slot));
  console.log(
    '[PlayersField] canSelectGoalkeeper =',
    result,
    'defenders=',
    defenders.value,
  );
  return result;
});

const selectedDefenderIndex = ref<number | null>(null);
const goalkeeperSelected = ref(false);

watch(
  () => props.scene,
  () => {
    if (
      selectedDefenderIndex.value !== null ||
      goalkeeperSelected.value
    ) {
      selectedDefenderIndex.value = null;
      goalkeeperSelected.value = false;

      emit('defender-selected', null);
      emit('goalkeeper-selected', false);

      console.log('[PlayersField] scene changed -> selection reset');
    }
  },
);

function onDefenderSelect(index: number) {
  if (props.busy) return;

  if (selectedDefenderIndex.value === index) {
    selectedDefenderIndex.value = null;
    emit('defender-selected', null);
  } else {
    selectedDefenderIndex.value = index;
    goalkeeperSelected.value = false;
    emit('defender-selected', index);
  }

  console.log(
    '[PlayersField] onDefenderSelect -> selectedDefenderIndex=',
    selectedDefenderIndex.value,
  );
}

function onGoalkeeperSelect() {
  if (props.busy) return;

  if (!canSelectGoalkeeper.value) {
    console.log(
      '[PlayersField] onGoalkeeperSelect blocked – defenders still alive',
    );
    return;
  }

  const next = !goalkeeperSelected.value;
  goalkeeperSelected.value = next;

  if (next) {
    selectedDefenderIndex.value = null;
    emit('defender-selected', null);
  }
  emit('goalkeeper-selected', next);

  console.log(
    '[PlayersField] onGoalkeeperSelect -> goalkeeperSelected=',
    goalkeeperSelected.value,
  );
}
</script>

<template>
   <div class="players-field-bar">
    <div class="player-label">
      Defender&apos;s Field
    </div>

    <FieldCardRow
      :defenders="defenders"
      :goalkeeper="goalkeeper"
      :selectedDefenderIndex="selectedDefenderIndex"
      :goalkeeperSelected="goalkeeperSelected"
      :defendersClickable="!props.busy"
      :goalkeeperClickable="!props.busy && canSelectGoalkeeper"
      defenders-aria-label="Defender cards"
      goalkeeper-aria-label="Goalkeeper"
      @select:defender="onDefenderSelect"
      @select:goalkeeper="onGoalkeeperSelect"
    />
  </div>

</template>
