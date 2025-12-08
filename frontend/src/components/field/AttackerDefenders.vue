<script setup lang="ts">
import FieldCardRow from './FieldCardRow.vue';
import type { SlotLike } from '../../types/FieldCards';
import type { SelectedTarget } from '../../types/AttackerDefenders';
import { onMounted, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    defenders: SlotLike[];
    goalkeeper: SlotLike | null;
    selectedTarget?: SelectedTarget | null;
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
  (e: 'update:selectedTarget', value: SelectedTarget | null): void;
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
  const next: SelectedTarget | null = currentlySelected
    ? null
    : { kind: 'defender', index };

  console.log(
    '[AttackerDefenders] onDefenderSelect index=',
    index,
    'next=',
    next,
  );
  emit('update:selectedTarget', next);
}

function onGoalkeeperSelect() {
  if (!props.clickable) return;

  const currentlySelected = isGoalkeeperSelected();
  const next: SelectedTarget | null = currentlySelected
    ? null
    : { kind: 'goalkeeper' };

  emit('update:selectedTarget', next);
}

onMounted(() => {
  console.log('[AttackerDefenders] defenders=', props.defenders);
  console.log('[AttackerDefenders] goalkeeper=', props.goalkeeper);
});
const selectedDefenderIndex = computed<number | null>(() => {
  if (!props.selectedTarget) return null;
  return props.selectedTarget.kind === 'defender'
    ? props.selectedTarget.index
    : null;
});

const goalkeeperSelected = computed<boolean>(() => {
  return props.selectedTarget?.kind === 'goalkeeper';
});

</script>

<template>
  <div class="attacker-field-bar">
    <FieldCardRow
      :defenders="defenders"
      :goalkeeper="goalkeeper"
      :selectedDefenderIndex="selectedDefenderIndex"
      :goalkeeperSelected="goalkeeperSelected"
      :defendersClickable="clickable"
      :goalkeeperClickable="clickable"
      defenders-aria-label="Defenders"
      goalkeeper-aria-label="Goalkeeper"
      @select:defender="onDefenderSelect"
      @select:goalkeeper="onGoalkeeperSelect"
    />
  </div>
</template>
