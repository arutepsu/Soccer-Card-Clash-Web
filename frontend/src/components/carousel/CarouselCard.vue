<script setup lang="ts">
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
  <article
    class="carousel-card"
    :class="`carousel-card--${role}`"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div class="carousel-card__inner" :style="frameStyle">
      <div class="carousel-card__content">
        <h2 class="carousel-card__title">
          {{ title }}
        </h2>

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
      </div>
    </div>
  </article>
</template>

<style scoped>
.carousel-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  opacity: 0;
  pointer-events: none;

  transition:
    transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.6s ease-out,
    filter 0.6s ease-out;
  will-change: transform, opacity, filter;
}

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
  text-align: center;

  color: #e8eef5;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  font-family: 'Rajdhani', Arial, sans-serif;
}

.carousel-card__title {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
}

.carousel-card__description {
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 0.8rem;
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
}

.carousel-card--prev,
.carousel-card--next {
  opacity: 0.7;
  pointer-events: none;
  z-index: 2;
  filter: blur(0.5px);
}

.carousel-card--prev {
  transform: translate(-85%, -50%) scale(0.9) rotate(-5deg);
}

.carousel-card--next {
  transform: translate(-15%, -50%) scale(0.9) rotate(5deg);
}

@media (max-width: 576px) {
  .carousel-card__inner {
    width: min(85vw, 420px);
  }

  .carousel-card--prev {
    transform: translate(-95%, -50%) scale(0.88) rotate(-3deg);
  }

  .carousel-card--next {
    transform: translate(-5%, -50%) scale(0.88) rotate(3deg);
  }
}

.carousel-card--current {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1);
  z-index: 3;
  filter: none;
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
    width: min(85vw, 420px);
  }

  .carousel-card--prev {
    transform: translate(-125%, -50%) scale(0.88) rotate(-3deg);
  }

  .carousel-card--next {
    transform: translate(25%, -50%) scale(0.88) rotate(3deg);
  }
}
</style>
