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

.carousel-card__inner {
  --frame-img: none;
  --safe-top: 10%;
  --safe-right: 10%;
  --safe-bottom: 10%;
  --safe-left: 10%;

  width: min(96vw, 820px);
  aspect-ratio: 1200 / 800;

  position: relative;
  background: var(--frame-img) center / contain no-repeat;

  filter: drop-shadow(0 0 18px rgba(0, 0, 0, 0.65));
  transition: filter 0.3s ease, transform 0.3s ease;
}
.carousel-card :deep(.v-card-text) {
  padding: 0 !important;
}
.carousel-card :deep(.v-card-title) {
  padding: 0 !important;
}

.carousel-card__content {
  top: var(--safe-top);
  right: var(--safe-right);
  bottom: var(--safe-bottom);
  left: var(--safe-left);

  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  gap: 0.6rem;
}

.carousel-card__content {
  position: absolute;
  top: var(--safe-top);
  right: var(--safe-right);
  bottom: var(--safe-bottom);
  left: var(--safe-left);

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  gap: 0.75rem;

  color: #e8eef5;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  font-family: 'Rajdhani', Arial, sans-serif;
}

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
}

.carousel-card__description {
  font-size: 1.2rem;
  line-height: 1.35;
  margin: 0.4rem auto 0.8rem;
  max-width: 18rem;
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

.carousel-card--current {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1);
  z-index: 3;
  filter: none;

  animation: floatIdle 4s ease-in-out infinite;
}

@keyframes floatIdle {
  0%   { transform: translate(-50%, -50%) scale(1); }
  50%  { transform: translate(-50%, -52%) scale(1.015); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

.carousel-card--current:hover .carousel-card__inner {
  filter: drop-shadow(0 0 28px rgba(255, 255, 255, 0.38));
  transform: scale(1.02);
}

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

@media (max-width: 576px) {
  .carousel-card__inner {
    width: 100vw;
    max-width: 720px;
    aspect-ratio: 1200 / 1500;
  }

  .carousel-card__content {
    top: 30%;
    right: 7%;
    bottom: 18%;
    left: 7%;

    justify-content: flex-start; /* avoid stretching */
    gap: 0.6rem;
  }

  .carousel-card__title {
    font-size: 1.05rem;
    letter-spacing: 0.1em;
  }

  .carousel-card__description {
    font-size: 1.05rem;
    line-height: 1.4;
    max-width: 20rem;

    margin: 0;
    padding: 0 0.25rem;
  }

  /* keep button from becoming too wide */
  .carousel-card__button-wrap :deep(.game-button),
  .carousel-card__button-wrap :deep(button) {
    width: min(78vw, 260px);
  }
}


.carousel-card.moving .carousel-card__inner {
  filter: blur(2px) brightness(1.15)
          drop-shadow(0 0 20px rgba(0, 0, 0, 0.4));
  transition: filter 0.15s ease;
}
</style>
