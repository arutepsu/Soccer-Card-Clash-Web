<!-- frontend/src/components/PlayersField.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import FieldCard from './FieldCard.vue';
import type { SceneView } from '../scenes/playingField/sceneMapping';
import type { FieldSlot, FieldCardData } from '../components/fieldCardRenderer';

type SlotLike = FieldSlot | FieldCardData | null | undefined;

type SelectedTarget =
  | { kind: 'defender'; index: number }
  | { kind: 'goalkeeper' }
  | null;

const props = withDefaults(
  defineProps<{
    scene: SceneView | null;
    selectedTarget?: SelectedTarget | null;
    busy?: boolean;
  }>(),
  {
    scene: null,
    selectedTarget: null,
    busy: false,
  },
);

const emit = defineEmits<{
  (e: 'update:selectedTarget', value: SelectedTarget): void;
}>();

// ----- mapping helpers: now based on SceneView -----

function defenderSlotsOf(scene: SceneView | null): SlotLike[] {
  const anyScene = scene as any;
  // try a few plausible shapes – adjust if your SceneView differs
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

// ----- selection helpers -----

function isDefenderSelected(index: number): boolean {
  return (
    props.selectedTarget?.kind === 'defender' &&
    props.selectedTarget.index === index
  );
}

function isGoalkeeperSelected(): boolean {
  return props.selectedTarget?.kind === 'goalkeeper';
}

function onDefenderSelect(index: number) {
  if (props.busy) return;

  const currentlySelected = isDefenderSelected(index);
  emit(
    'update:selectedTarget',
    currentlySelected ? null : { kind: 'defender', index },
  );
}

function onGoalkeeperSelect() {
  if (props.busy) return;

  const currentlySelected = isGoalkeeperSelected();
  emit(
    'update:selectedTarget',
    currentlySelected ? null : { kind: 'goalkeeper' },
  );
}
</script>

<template>
  <!-- mirrors structure inside <section id="field"> -->
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
