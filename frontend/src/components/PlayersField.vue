<!-- frontend/src/components/PlayersField.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import FieldCard from './FieldCard.vue';
import type { SceneView } from '../scenes/playingField/sceneMapping';
import type { FieldSlot, FieldCardData } from '../components/fieldCardRenderer';

type SlotLike = FieldSlot | FieldCardData | null | undefined;

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

// ----- mapping helpers -----

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
  return padded;
}

function goalkeeperSlotOf(scene: SceneView | null): SlotLike | null {
  const anyScene = scene as any;
  const gkSlot =
    anyScene?.cards?.defenderGoalkeeper ??
    anyScene?.gameCards?.field?.goalkeeper ??
    anyScene?.gameCards?.defenderGoalkeeper ??
    null;

  return gkSlot ?? null;
}

const defenders = computed<SlotLike[]>(() => defenderSlotsOf(props.scene));
const goalkeeper = computed<SlotLike | null>(() =>
  goalkeeperSlotOf(props.scene),
);

// helper: does a defender slot still have a “live” card?
function hasLiveDefender(slot: SlotLike): boolean {
  if (!slot) return false;

  // Shape: FieldSlot { card?: FieldCardData | null }
  if (typeof slot === 'object' && 'card' in slot) {
    const card = (slot as FieldSlot).card as any;
    if (!card) return false;

    // if the card has defeat flags, treat as dead
    if (card.isDefeated || card.defeated) return false;

    // no fileName usually means "no real card"
    return !!card.fileName;
  }

  // Shape: plain FieldCardData
  const card = slot as any;
  if (card.isDefeated || card.defeated) return false;
  return !!card.fileName;
}

// GK can only be clicked if ALL defenders are empty / defeated
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

// ----- local selection state -----

const selectedDefenderIndex = ref<number | null>(null);
const goalkeeperSelected = ref(false);

function isDefenderSelected(index: number): boolean {
  return selectedDefenderIndex.value === index;
}

function isGoalkeeperSelected(): boolean {
  return goalkeeperSelected.value;
}

// ⭐ Reset selection whenever the scene (cards) changes
watch(
  () => props.scene,
  () => {
    if (
      selectedDefenderIndex.value !== null ||
      goalkeeperSelected.value
    ) {
      selectedDefenderIndex.value = null;
      goalkeeperSelected.value = false;

      // keep parent in sync so selectedTarget gets cleared
      emit('defender-selected', null);
      emit('goalkeeper-selected', false);

      console.log('[PlayersField] scene changed -> selection reset');
    }
  },
);

function onDefenderSelect(index: number) {
  if (props.busy) return;

  if (selectedDefenderIndex.value === index) {
    // toggle off
    selectedDefenderIndex.value = null;
    emit('defender-selected', null);
  } else {
    // select this defender, clear goalkeeper locally
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
    // selecting GK clears defender selection
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

    <div
      class="defender-row"
      role="group"
      aria-label="Defender cards"
    >
      <FieldCard
        v-for="(slot, index) in defenders"
        :key="(slot as any)?.id ?? index"
        :card="slot"
        :index="index"
        role="defender"
        :selected="isDefenderSelected(index)"
        :clickable="!props.busy"
        @select="onDefenderSelect(index)"
      />
    </div>

    <div
      class="goalkeeper-row"
      role="group"
      aria-label="Goalkeeper"
    >
      <FieldCard
        :card="goalkeeper"
        index="gk"
        role="goalkeeper"
        :selected="isGoalkeeperSelected()"
        :clickable="!props.busy && canSelectGoalkeeper"
        @select="onGoalkeeperSelect"
      />
    </div>
  </div>
</template>
