<script setup lang="ts">
import FieldCard from '../card/FieldCard.vue';
import type { SlotLike } from '../../types/FieldCards';

const props = withDefaults(
  defineProps<{
    defenders: SlotLike[];
    goalkeeper: SlotLike | null;

    selectedDefenderIndex: number | null;
    goalkeeperSelected: boolean;

    defendersClickable?: boolean;
    goalkeeperClickable?: boolean;

    defendersAriaLabel?: string;
    goalkeeperAriaLabel?: string;
  }>(),
  {
    defenders: () => [],
    goalkeeper: null,
    selectedDefenderIndex: null,
    goalkeeperSelected: false,
    defendersClickable: true,
    goalkeeperClickable: true,
    defendersAriaLabel: 'Defenders',
    goalkeeperAriaLabel: 'Goalkeeper',
  },
);

const emit = defineEmits<{
  (e: 'select:defender', index: number): void;
  (e: 'select:goalkeeper'): void;
}>();

function isDefenderSelected(index: number): boolean {
  return props.selectedDefenderIndex === index;
}

function isGoalkeeperSelected(): boolean {
  return props.goalkeeperSelected;
}
</script>

<template>
  <div class="fieldcard-rows">
    <div
      class="defender-row"
      role="group"
      :aria-label="props.defendersAriaLabel"
    >
      <FieldCard
        v-for="(slot, index) in defenders"
        :key="(slot as any)?.id ?? index"
        :card="slot"
        :index="index"
        role="defender"
        :clickable="defendersClickable"
        :selected="isDefenderSelected(index)"
        @select="emit('select:defender', index)"
      />
    </div>

    <div
      class="goalkeeper-row"
      role="group"
      :aria-label="props.goalkeeperAriaLabel"
    >
      <FieldCard
        :card="goalkeeper"
        index="gk"
        role="goalkeeper"
        :clickable="goalkeeperClickable"
        :selected="isGoalkeeperSelected()"
        @select="emit('select:goalkeeper')"
      />
    </div>
  </div>
</template>
