<!-- frontend/src/components/AttackerHand.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import type { HandCardLike } from '../types/HandCards';
import HandCardRow from './HandCardRow.vue';

const props = withDefaults(
  defineProps<{
    hand: HandCardLike[];
    selectedIndex?: number | null;
    attackerName?: string | null;
  }>(),
  {
    selectedIndex: null,
    attackerName: null,
  },
);

const emit = defineEmits<{
  (e: 'update:selectedIndex', value: number | null): void;
}>();

const rowRef = ref<HTMLElement | null>(null);
const overlap = ref<number>(-40);

const ariaLabel = computed(
  () => (props.attackerName || 'Attacker') + ' hand',
);

async function recomputeOverlap() {
  await nextTick();
  const row = rowRef.value;
  if (!row) return;

  const first = row.querySelector<HTMLElement>('.hand-card');
  const handSize = props.hand?.length ?? 0;

  if (!first || handSize <= 0) {
    overlap.value = -40;
    return;
  }

  const w = parseFloat(getComputedStyle(first).width) || 140;
  const ratio =
    handSize >= 10 ? 0.6 :
    handSize >= 6  ? 0.5 :
                     0.3;

  overlap.value = -Math.round(w * ratio);
}

watch(
  () => props.hand.length,
  () => {
    recomputeOverlap();
  },
);

onMounted(() => {
  recomputeOverlap();
});

</script>

<template>
  <HandCardRow
    :cards="hand"
    :selectedIndex="selectedIndex"
    :ariaLabel="ariaLabel"
    :clickable="true"
    :disabled="false"
    @update:selectedIndex="(val) => emit('update:selectedIndex', val)"
  />
</template>

<style scoped>
.hand-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.hand-card:hover {
  transform: translateY(-2px) scale(1.05);
}

.hand-card.is-selected {
  outline: 2px solid #ffd54f;
  box-shadow: 0 0 8px rgba(255, 213, 79, 0.9);
}
</style>
