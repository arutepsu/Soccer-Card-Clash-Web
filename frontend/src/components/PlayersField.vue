<!-- frontend/src/components/PlayersField.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue';
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

// ----- local selection state (like old PlayersFieldBar) -----

const selectedDefenderIndex = ref<number | null>(null);
const goalkeeperSelected = ref(false);

function isDefenderSelected(index: number): boolean {
  return selectedDefenderIndex.value === index;
}

function isGoalkeeperSelected(): boolean {
  return goalkeeperSelected.value;
}

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
    // ❌ do NOT emit 'goalkeeper-selected', false here
  }

  console.log(
    '[PlayersField] onDefenderSelect -> selectedDefenderIndex=',
    selectedDefenderIndex.value,
  );
}

function onGoalkeeperSelect() {
  if (props.busy) return;

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
        :clickable="!props.busy"
        @select="onGoalkeeperSelect"
      />
    </div>
  </div>
</template>
