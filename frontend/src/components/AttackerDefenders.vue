<script setup lang="ts">
import FieldCard from './FieldCard.vue';
import type { SlotLike } from '../types/FieldCards';
import type { SelectedTarget } from '../types/AttackerDefenders';
import { onMounted } from 'vue';

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

</script>


<template>
  <div class="attacker-field-bar">
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
