<!-- frontend/src/components/AttackerDefenders.vue -->
<script setup lang="ts">
import FieldCard from './FieldCard.vue';
import type { SlotLike } from '../types/FieldCards';
import type { SelectedTarget } from '../types/AttackerDefenders';

const props = withDefaults(
  defineProps<{
    defenders: SlotLike[];
    goalkeeper: SlotLike | null;
    selectedTarget?: SelectedTarget | null;
    /** disable interaction when busy */
    clickable?: boolean;
  }>(),
  {
    defenders: () => [],
    goalkeeper: null,
    selectedTarget: null,
    clickable: true,
  },
);

const emit = defineEmits<{
  (e: 'update:selectedTarget', value: SelectedTarget): void;
}>();

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
  if (!props.clickable) return;

  const currentlySelected = isDefenderSelected(index);
  emit(
    'update:selectedTarget',
    currentlySelected ? null : { kind: 'defender', index },
  );
}

function onGoalkeeperSelect() {
  if (!props.clickable) return;

  const currentlySelected = isGoalkeeperSelected();
  emit(
    'update:selectedTarget',
    currentlySelected ? null : { kind: 'goalkeeper' },
  );
}
</script>

<template>
  <!-- This corresponds to the inner "attacker-field-bar" inside #attacker-defenders-field -->
  <div class="attacker-field-bar">
    <!-- Defenders row -->
    <div
      class="defender-row"
      role="group"
      aria-label="Defenders"
    >
      <FieldCard
        v-for="(slot, index) in defenders"
        :key="(slot as any)?.id ?? index"
        :card="slot"
        :index="index"
        role="defender"
        :clickable="clickable"
        :selected="isDefenderSelected(index)"
        @select="onDefenderSelect(index)"
      />
    </div>

    <!-- Goalkeeper row -->
    <div
      class="goalkeeper-row"
      role="group"
      aria-label="Goalkeeper"
    >
      <FieldCard
        :card="goalkeeper"
        index="gk"
        role="goalkeeper"
        :clickable="clickable"
        :selected="isGoalkeeperSelected()"
        @select="onGoalkeeperSelect"
      />
    </div>
  </div>
</template>
