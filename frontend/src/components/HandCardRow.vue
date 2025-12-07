<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import HandCard from './HandCard.vue';
import type { HandCardLike } from '../types/HandCards';

const props = withDefaults(
  defineProps<{
    cards: HandCardLike[];
    selectedIndex?: number | null;
    ariaLabel?: string | null;
    clickable?: boolean;
    disabled?: boolean;
  }>(),
  {
    selectedIndex: null,
    ariaLabel: null,
    clickable: true,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:selectedIndex', value: number | null): void;
}>();

const rowRef = ref<HTMLElement | null>(null);
const overlap = ref<number>(-40);

const effectiveSelectedIndex = computed({
  get: () => props.selectedIndex ?? -1,
  set: (value: number | null) => {
    emit('update:selectedIndex', value);
  },
});

async function recomputeOverlap() {
  await nextTick();
  const row = rowRef.value;
  if (!row) return;

  const first = row.querySelector<HTMLElement>('.hand-card');
  const handSize = props.cards?.length ?? 0;

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
  () => props.cards.length,
  () => {
    recomputeOverlap();
  },
);

onMounted(() => {
  recomputeOverlap();
});

function toggleSelection(index: number) {
  if (props.disabled || !props.clickable) return;

  const current = effectiveSelectedIndex.value;
  effectiveSelectedIndex.value = current === index ? null : index;
}

const ariaLabelResolved = computed(
  () => props.ariaLabel ?? 'Hand cards',
);
</script>

<template>
  <div
    class="hand-row hand-row-inner"
    ref="rowRef"
    role="listbox"
    :aria-label="ariaLabelResolved"
    :aria-disabled="disabled ? 'true' : 'false'"
    aria-multiselectable="false"
  >
    <HandCard
      v-for="(card, index) in cards"
      :key="card.fileName ?? index"
      :card="card"
      :index="index"
      :overlap="overlap"
      :selected="effectiveSelectedIndex === index"
      :clickable="!disabled && clickable"
      @select="toggleSelection(index)"
    />
  </div>
</template>
