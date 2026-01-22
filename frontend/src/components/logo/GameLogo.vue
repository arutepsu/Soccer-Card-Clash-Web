<template>
  <VCard class="logo-card pa-0" elevation="0" variant="text">
    <VImg
      :src="src"
      :alt="alt"
      class="logo-image"
      contain
      draggable="false"
    />
  </VCard>
</template>

<script setup lang="ts">
import { VCard, VImg } from 'vuetify/components';
import logoDefault from '@/assets/images/logo/logo0.5k.png';

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
  }>(),
  {
    src: logoDefault,
    alt: 'Soccer Card Clash Logo',
  },
);
</script>

<style scoped>
@keyframes slamIn {
  0% {
    transform: translateY(-40px) scale(0.7);
    opacity: 0;
  }
  70% {
    transform: translateY(10px) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes pulseGlow {
  0%   { filter: drop-shadow(0 0 12px var(--v-theme-primary)); }
  50%  { filter: drop-shadow(0 0 24px var(--v-theme-primary)); }
  100% { filter: drop-shadow(0 0 12px var(--v-theme-primary)); }
}


.logo-card {
  margin: 0 auto 1rem;
  display: flex;
  justify-content: center;
  align-items: center;

  width: min(86vw, 320px);
  box-sizing: border-box;
  padding: 0.75rem;

  background-color: transparent !important;
  border: 2px solid var(--v-theme-primary);
  overflow: hidden;
  will-change: transform, filter;
  transition: transform 180ms ease, filter 180ms ease;
  animation:
    slamIn 0.6s cubic-bezier(0.2, 1.2, 0.3, 1.0),
    pulseGlow 3.5s ease-in-out infinite;
}

/* Center the VImg block itself */
.logo-image {
  width: 100%;
  margin: 0 auto;
}

/* Vuetify internals: make sure the actual rendered image is centered */
.logo-image :deep(.v-img__img),
.logo-image :deep(img) {
  object-fit: contain !important;
  object-position: 50% 50% !important;
  display: block;
  margin: 0 auto;
}


.logo-card:hover {
  transform: scale(1.03);
  filter: drop-shadow(0 0 28px var(--v-theme-primary));
}


.logo-image {
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
  user-select: none;
}

.logo-card:active {
  transform: scale(0.99);
}

</style>
