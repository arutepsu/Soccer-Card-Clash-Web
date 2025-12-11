<script setup lang="ts">
import { VCard, VCardTitle, VCardText } from 'vuetify/components';
import GameButton from '../button/GameButton.vue';
import carouselCard from '@/assets/images/frames/carouselCard.png';

const props = defineProps<{
  title: string;
  description: string;
  buttonLabel: string;
  role: 'prev' | 'current' | 'next';
}>();

const emit = defineEmits<{
  (e: 'command'): void;
  (e: 'hover', hovering: boolean): void;
}>();

function onEnter() {
  emit('hover', true);
}

function onLeave() {
  emit('hover', false);
}

function onGameButtonHover(payload: any) {
  const hovering = payload?.hovering ?? payload;
  emit('hover', !!hovering);
}

function onGameButtonCommand() {
  emit('command');
}

const frameStyle = {
  '--frame-img': `url("${carouselCard}")`,
  '--safe-top': '16%',
  '--safe-right': '8%',
  '--safe-bottom': '16%',
  '--safe-left': '8%',
};
</script>

<template>
  <VCard
    class="carousel-card"
    :class="`carousel-card--${role}`"
    elevation="0"
    color="transparent"
    rounded="0"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >

    <div class="carousel-card__inner" :style="frameStyle">
      <VCardText class="carousel-card__content">
        <VCardTitle class="carousel-card__title">
          {{ title }}
        </VCardTitle>

        <p class="carousel-card__description">
          {{ description }}
        </p>

        <div
          v-if="role === 'current'"
          class="carousel-card__button-wrap"
        >
          <GameButton
            :action="title"
            :label="buttonLabel"
            @command="onGameButtonCommand"
            @hover="onGameButtonHover"
          />
        </div>
      </VCardText>
    </div>
  </VCard>
</template>

<style scoped>
.carousel-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  opacity: 0;
  pointer-events: none;

  background: transparent !important;
  box-shadow: none !important;

  transition:
    transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.55s ease-out,
    filter 0.55s ease-out;
  will-change: transform, opacity, filter;
}

/* Frame */
.carousel-card__inner {
  --frame-img: none;
  --safe-top: 10%;
  --safe-right: 10%;
  --safe-bottom: 10%;
  --safe-left: 10%;

  width: min(90vw, 720px);
  aspect-ratio: 1200 / 800;

  position: relative;
  background: var(--frame-img) center / contain no-repeat;

  filter: drop-shadow(0 0 18px rgba(0, 0, 0, 0.65));
  transition: filter 0.3s ease, transform 0.3s ease;
}

/* Content: vertical stack inside safe frame */
.carousel-card__content {
  position: absolute;
  top: var(--safe-top);
  right: var(--safe-right);
  bottom: var(--safe-bottom);
  left: var(--safe-left);

  display: flex;
  flex-direction: column;          /* title -> text -> button */
  justify-content: space-between;
  align-items: center;
  text-align: center;
  gap: 0.75rem;

  color: #e8eef5;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  font-family: 'Rajdhani', Arial, sans-serif;
}

/* Purple neon title (horizontal) */
.carousel-card__title {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0;

  color: #d28cff;
  text-shadow:
    0 0 6px #d28cff,
    0 0 12px #b455ff,
    0 0 24px #8f3dff,
    /* 0 0 36px rgba(180, 85, 255, 0.7),
    0 0 48px rgba(180, 85, 255, 0.45); */
}

/* Description: normal horizontal text, fits frame */
.carousel-card__description {
  font-size: 1.2rem;
  line-height: 1.35;
  margin: 0.4rem auto 0.8rem;
  max-width: 18rem;                /* keep lines short so it fits */
  overflow-wrap: break-word;
  hyphens: auto;

  color: #e8d8ff;
  text-shadow:
    0 0 4px #a76cff,
    0 0 10px rgba(150, 90, 255, 0.5);
}

.carousel-card__button-wrap {
  align-self: center;
}

/* ===== CURRENT: Floating Idle Animation ===== */
.carousel-card--current {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1);
  z-index: 3;
  filter: none;

  animation: floatIdle 4s ease-in-out infinite;
}

/* Floating animation */
@keyframes floatIdle {
  0%   { transform: translate(-50%, -50%) scale(1); }
  50%  { transform: translate(-50%, -52%) scale(1.015); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

/* Hover glow */
.carousel-card--current:hover .carousel-card__inner {
  filter: drop-shadow(0 0 28px rgba(255, 255, 255, 0.38));
  transform: scale(1.02);
}

/* ===== PREV / NEXT ===== */
.carousel-card--prev,
.carousel-card--next {
  opacity: 0.7;
  pointer-events: none;
  z-index: 2;
  filter: blur(0.5px);
}

.carousel-card--prev {
  transform: translate(-95%, -50%) scale(0.9) rotate(-4deg);
}

.carousel-card--next {
  transform: translate(-5%, -50%) scale(0.9) rotate(4deg);
}

/* Mobile tweaks */
@media (max-width: 576px) {
  .carousel-card__inner {
    width: min(85vw, 420px);
  }

  .carousel-card--prev {
    transform: translate(-125%, -50%) scale(0.88) rotate(-3deg);
  }

  .carousel-card--next {
    transform: translate(25%, -50%) scale(0.88) rotate(3deg);
  }
}

.carousel-card.moving .carousel-card__inner {
  filter: blur(2px) brightness(1.15)
          drop-shadow(0 0 20px rgba(0, 0, 0, 0.4));
  transition: filter 0.15s ease;
}
</style>
