<!-- frontend/src/components/AttackerAvatar.vue -->
<script setup lang="ts">
import { VImg } from 'vuetify/components';

const props = withDefaults(
  defineProps<{
    name: string;
    img: string;
  }>(),
  {
    name: 'Attacker',
  },
);
</script>

<template>
  <div class="attacker-avatar-box">
    <div class="attacker-label text-uppercase">
      {{ name }}
    </div>

    <VImg
      :src="img"
      :alt="`${name} avatar`"
      class="attacker-avatar-img"
      cover
    />
  </div>
</template>

<style scoped>
.attacker-avatar-box {
  position: absolute;
  right: 275px;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 115px;
  z-index: 5;
}

.attacker-label {
  font-family: "Rajdhani", sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #cfd7ff;
  text-shadow: 0 0 6px rgba(120, 140, 255, 0.8);
  margin-bottom: 10px;
}

.attacker-avatar-img {
  width: 70px;
  height: auto;
  border-radius: 8px;
  object-fit: contain;
  box-shadow: 0 0 10px rgba(120, 140, 255, 0.8);
}

@media (max-width: 1024px) {
  .attacker-avatar-box {
    right: 200px;
    width: 100px;
  }
  .attacker-avatar-img {
    width: 60px;
  }
  .attacker-label {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .attacker-avatar-box {
    position: static;
    order: -1;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    width: auto;
  }
  .attacker-label {
    margin-bottom: 0;
  }
}

@media (max-width: 480px) {
  .attacker-avatar-img {
    width: 50px;
  }
  .attacker-label {
    font-size: 16px;
  }
}

@media (max-height: 600px) and (orientation: landscape) {
  .attacker-avatar-box {
    right: 5px;
    bottom: 5px;
    width: 90px;
  }
  .attacker-avatar-img {
    width: 45px;
  }
  .attacker-label {
    font-size: 14px;
    margin-bottom: 0;
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  .attacker-avatar-box {
    width: 80px;
  }
  .attacker-avatar-img {
    width: 40px;
  }
  .attacker-label {
    font-size: 12px;
  }
}
</style>
