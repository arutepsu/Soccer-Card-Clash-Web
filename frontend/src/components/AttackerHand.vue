<!-- frontend/src/components/AttackerHand.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import type { HandCardLike } from '../types/HandCards';

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

function toggleSelection(index: number) {
  const current = effectiveSelectedIndex.value;
  effectiveSelectedIndex.value = current === index ? null : index;
}

function onCardKeydown(index: number, event: KeyboardEvent) {
  const key = event.key;

  if (key === 'Enter' || key === ' ') {
    event.preventDefault();
    toggleSelection(index);
    focusCard(index);
    return;
  }

  if (key === 'ArrowLeft') {
    event.preventDefault();
    const next = Math.max(0, index - 1);
    effectiveSelectedIndex.value = next;
    focusCard(next);
    return;
  }

  if (key === 'ArrowRight') {
    event.preventDefault();
    const len = props.hand.length;
    const next = Math.min(len - 1, index + 1);
    effectiveSelectedIndex.value = next;
    focusCard(next);
    return;
  }

  if (key === 'Escape') {
    event.preventDefault();
    effectiveSelectedIndex.value = null;
  }
}

function focusCard(index: number) {
  const row = rowRef.value;
  if (!row) return;
  const el = row.querySelector<HTMLElement>(`.hand-card[data-index="${index}"]`);
  el?.focus();
}
</script>

<template>
  <div
    id="attacker-hand"
    class="hand-row hand-row-inner"
    ref="rowRef"
    role="listbox"
    :aria-label="(attackerName || 'Attacker') + ' hand'"
    aria-multiselectable="false"
  >
    <div
      v-for="(card, index) in hand"
      :key="card.fileName ?? index"
      class="hand-card game-card"
      :data-index="index"
      role="option"
      tabindex="0"
      :aria-selected="effectiveSelectedIndex === index ? 'true' : 'false'"
      :class="{ 'is-selected': effectiveSelectedIndex === index }"
      :style="{
        marginLeft: index === 0 ? '0px' : overlap + 'px',
        zIndex: String(index + 1),
        backgroundImage: card.img ? `url('${card.img}')` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }"
      @click="toggleSelection(index)"
      @keydown="onCardKeydown(index, $event as KeyboardEvent)"
    >
      <span v-if="!card.img">
        {{ index === hand.length - 1 ? (card.fileName ?? 'card') : '🂠' }}
      </span>
    </div>
  </div>
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
