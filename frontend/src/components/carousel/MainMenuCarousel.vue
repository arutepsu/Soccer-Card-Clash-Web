<script setup lang="ts">
import { computed, ref } from 'vue';
import CarouselCard from './CarouselCard.vue';

type MenuAction = string;

interface MenuItem {
  action: MenuAction;
  title: string;
  description: string;
  buttonLabel: string;
}

const props = defineProps<{
  items: MenuItem[];
}>();

const emit = defineEmits<{
  (e: 'command', payload: { action: MenuAction }): void;
  (e: 'hover', payload: { action: MenuAction; hovering: boolean }): void;
}>();

const currentIndex = ref(0);
const isAnimating = ref(false);
const transitionDirection = ref<'next' | 'prev' | null>(null);

const visibleCards = computed(() => {
  const len = props.items.length;
  if (!len) return [];

  const current = currentIndex.value;
  const prev = (current - 1 + len) % len;
  const next = (current + 1) % len;

  return [
    { role: 'prev' as const, card: props.items[prev] },
    { role: 'current' as const, card: props.items[current] },
    { role: 'next' as const, card: props.items[next] },
  ];
});

const trackClasses = computed(() => ({
  'menu-carousel__track--next': transitionDirection.value === 'next',
  'menu-carousel__track--prev': transitionDirection.value === 'prev',
}));

function runTransition(direction: 'next' | 'prev', updateIndex: () => void) {
  if (!props.items.length || isAnimating.value) return;

  isAnimating.value = true;
  transitionDirection.value = direction;

  setTimeout(() => {
    updateIndex();
  }, 40);

  setTimeout(() => {
    transitionDirection.value = null;
    isAnimating.value = false;
  }, 620);
}

function next() {
  runTransition('next', () => {
    currentIndex.value = (currentIndex.value + 1) % props.items.length;
  });
}

function prev() {
  runTransition('prev', () => {
    currentIndex.value =
      (currentIndex.value - 1 + props.items.length) % props.items.length;
  });
}

function getCurrentAction(): MenuAction | null {
  if (!props.items.length) return null;
  return props.items[currentIndex.value].action;
}

function handleCardClick(action: MenuAction) {
  emit('command', { action });
}

function handleHover(action: MenuAction, hovering: boolean) {
  emit('hover', { action, hovering });
}

defineExpose({
  next,
  prev,
  getCurrentAction,
});
</script>

<template>
  <section class="menu-carousel" aria-label="Main menu carousel">
    <div class="menu-carousel__track" :class="trackClasses">
      <CarouselCard
        v-for="slot in visibleCards"
        :key="slot.card.action"
        :role="slot.role"
        :title="slot.card.title"
        :description="slot.card.description"
        :button-label="slot.card.buttonLabel"
        @command="handleCardClick(slot.card.action)"
        @hover="handleHover(slot.card.action, $event)"
      />
    </div>

    <div class="menu-carousel__controls" aria-hidden="true">
      <button
        type="button"
        class="menu-carousel__nav menu-carousel__nav--prev"
        @click="prev"
      >
        ‹
      </button>
      <button
        type="button"
        class="menu-carousel__nav menu-carousel__nav--next"
        @click="next"
      >
        ›
      </button>
    </div>
  </section>
</template>

<style scoped>
.menu-carousel {
  position: relative;

  width: 100vw;
  max-width: 100vw;
  left: 50%;
  transform: translateX(-50%);

  height: 360px;
  max-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-carousel__track {
  position: relative;
  width: 100%;
  max-width: 720px;
  height: 100%;
  overflow: visible;
}

.menu-carousel__track--next :deep(.carousel-card),
.menu-carousel__track--prev :deep(.carousel-card) {
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}


.menu-carousel__controls {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.menu-carousel__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: auto;
  z-index: 20;
  border: none;

  width: 80px;
  height: 80px;
  border-radius: 50%;

  font-size: 3rem;
  line-height: 1;
  color: #ffffff;

  background: rgba(20, 20, 40, 0.75);
  box-shadow:
    0 0 18px rgba(95, 62, 252, 0.7),
    0 0 35px rgba(95, 62, 252, 0.4);
  backdrop-filter: blur(6px);

  display: flex;
  align-items: center;
  justify-content: center;

  transition:
    opacity 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.menu-carousel__nav--prev {
  left: 10vw;
}

.menu-carousel__nav--next {
  right: 10vw;
}

.menu-carousel__nav:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.2);
  box-shadow:
    0 0 30px rgba(95, 62, 252, 0.9),
    0 0 60px rgba(95, 62, 252, 0.6);
}

@media (max-width: 576px) {
  .menu-carousel__nav {
    width: 56px;
    height: 56px;
    font-size: 2rem;
  }

  .menu-carousel__nav--prev {
    left: 4vw;
  }

  .menu-carousel__nav--next {
    right: 4vw;
  }
}
</style>
