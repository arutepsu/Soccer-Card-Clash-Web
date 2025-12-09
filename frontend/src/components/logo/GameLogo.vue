<template>
  <div class="game-logo">
    <img
      class="logo-image"
      :src="src"
      :alt="alt"
      draggable="false"
    />
  </div>
</template>

<script setup lang="ts">
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
.game-logo {
  text-align: center;
  margin-bottom: 1rem;
}

.logo-image {
  width: 300px;
  height: auto;
  display: block;
  margin: 0 auto;
  image-rendering: auto;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
  transition: transform 0.3s ease;
  user-select: none;
}

.logo-image:hover {
  transform: scale(1.03);
}

@media (max-width: 1024px) {
  .logo-image { width: 260px; }
}

@media (max-width: 768px) {
  .logo-image { width: 220px; }
}

@media (max-width: 600px) {
  .logo-image { width: 200px; }
}

@media (max-width: 420px) {
  .logo-image { width: 180px; }
}

@media (max-height: 600px) and (orientation: landscape) {
  .logo-image { width: 200px; max-height: 16vh; }
}

@media (max-height: 500px) and (orientation: landscape) {
  .logo-image { width: 180px; max-height: 14vh; }
}

@media (max-height: 400px) and (orientation: landscape) {
  .logo-image { width: 160px; max-height: 12vh; }
}
</style>
