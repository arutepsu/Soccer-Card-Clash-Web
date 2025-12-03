<!-- frontend/src/components/AttackerHandBar.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';

export interface HandCardLike {
  imgFront?: string;
  imgBack?: string;
  img?: string;
  fileName?: string;
}

const props = defineProps<{
  cards: HandCardLike[];
  attackerName?: string | null;
  selectedIndex?: number | null;
}>();

const emit = defineEmits<{
  (e: 'update:selectedIndex', value: number | null): void;
  (e: 'select', payload: { index: number | null; card: HandCardLike | null }): void;
}>();

const internalSelected = ref<number | null>(
  typeof props.selectedIndex === 'number' ? props.selectedIndex : null,
);

watch(
  () => props.selectedIndex,
  (v) => {
    if (typeof v === 'number') {
      internalSelected.value = v;
    } else if (v == null) {
      internalSelected.value = null;
    }
  },
);

function isSelected(index: number): boolean {
  return internalSelected.value === index;
}

function emitSelection(index: number | null) {
  internalSelected.value = index;
  emit('update:selectedIndex', index);
  const card =
    index != null && index >= 0 && index < props.cards.length
      ? props.cards[index]
      : null;
  emit('select', { index, card });
}

function onCardClick(index: number) {
  if (isSelected(index)) {
    emitSelection(null);
  } else {
    emitSelection(index);
  }
}

function onCardKeydown(e: KeyboardEvent, index: number) {
  const key = e.key;

  if (key === 'Enter' || key === ' ') {
    e.preventDefault();
    onCardClick(index);
    return;
  }

  if (key === 'ArrowLeft') {
    e.preventDefault();
    const prev = Math.max(0, index - 1);
    emitSelection(prev);
    focusCard(prev);
    return;
  }

  if (key === 'ArrowRight') {
    e.preventDefault();
    const next = Math.min(props.cards.length - 1, index + 1);
    emitSelection(next);
    focusCard(next);
    return;
  }

  if (key === 'Escape') {
    e.preventDefault();
    emitSelection(null);
  }
}

function focusCard(index: number) {
  const cardEls = document.querySelectorAll<HTMLElement>('.hand-card');
  const el = cardEls[index];
  el?.focus();
}

const ariaLabel = computed(
  () => `${props.attackerName ?? 'Attacker'} hand`,
);
</script>

<template>
  <div class="attacker-hand-bar">
    <div
      class="hand-row hand-row-inner"
      role="listbox"
      :aria-label="ariaLabel"
      aria-multiselectable="false"
    >
      <div
        v-for="(card, index) in cards"
        :key="card.fileName ?? index"
        class="hand-card game-card"
        :data-index="index"
        :class="{ 'is-selected': isSelected(index) }"
        tabindex="0"
        role="option"
        :aria-selected="String(isSelected(index))"
        @click="onCardClick(index)"
        @keydown="onCardKeydown($event, index)"
        :style="{
          backgroundImage: card.img ? `url('${card.img}')` : undefined,
          backgroundSize: card.img ? 'cover' : undefined,
          backgroundPosition: card.img ? 'center' : undefined,
          backgroundRepeat: card.img ? 'no-repeat' : undefined,
        }"
      >
        <span v-if="!card.img">
          {{ card.fileName ?? 'card' }}
        </span>
      </div>
    </div>
  </div>
</template>
