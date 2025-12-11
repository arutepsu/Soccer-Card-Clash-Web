<template>
  <VCard
    class="logo-card pa-0"
    elevation="0"
    variant="text"
  >
    <VImg
      :src="src"
      :alt="alt"
      class="logo-image"
      width="300"
      cover
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
  0% {
    box-shadow: 0 0 12px var(--v-theme-primary);
  }
  50% {
    box-shadow: 0 0 24px var(--v-theme-primary);
  }
  100% {
    box-shadow: 0 0 12px var(--v-theme-primary);
  }
}

.logo-card {
  padding: 1rem;
  margin: 0 auto 1rem;

  display: flex;
  justify-content: center;
  align-items: center;

  text-align: center;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  background-color: transparent !important;
  border: 2px solid var(--v-theme-primary);
  overflow: hidden;

  animation:
    slamIn 0.6s cubic-bezier(0.2, 1.2, 0.3, 1.0),
    pulseGlow 3.5s ease-in-out infinite;
}

.logo-card:hover {
  transform: scale(1.03);
  box-shadow: 0 0 20px var(--v-theme-primary), 0 0 30px var(--v-theme-primary);
}

.logo-image {
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
  user-select: none;
}

@media (max-width: 1024px) {
  .logo-image :deep(img) { width: 260px !important; }
}

@media (max-width: 768px) {
  .logo-image :deep(img) { width: 220px !important; }
}

@media (max-width: 600px) {
  .logo-image :deep(img) { width: 200px !important; }
}

@media (max-width: 420px) {
  .logo-image :deep(img) { width: 180px !important; }
}

</style>
