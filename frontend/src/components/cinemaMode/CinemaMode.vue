<template>
  <teleport to="body">
    <div v-if="active" class="cinema">
      <div class="cinema__card">
        <div class="cinema__title">{{ message }}</div>
        <div v-if="subMessage" class="cinema__sub">{{ subMessage }}</div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
defineProps<{
  active: boolean;
  message: string;
  subMessage?: string;
}>();
</script>

<style scoped>
.cinema {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;

  background: rgba(0, 0, 0, 0.45);
  overflow: hidden;
  animation: cinemaFade 180ms ease-out;
}

.cinema::before {
  content: '';
  position: absolute;
  inset: -10%;
  pointer-events: none;

  background:
    radial-gradient(
      elipse at center,
      rgba(0, 0, 0, 0.0) 0%,
      rgba(0, 0, 0, 0.25) 45%,
      rgba(0, 0, 0, 0.65) 70%,
      rgba(0, 0, 0, 0.9) 100%
    );
}

.cinema__card {
  position: relative;
  z-index: 1;

  padding: 18px 22px;
  border-radius: 14px;

  background: rgba(20, 20, 20, 0.9);
  backdrop-filter: blur(6px);

  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
@keyframes cinemaFade {
  from {
    opacity: 0;
    transform: scale(1.01);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
