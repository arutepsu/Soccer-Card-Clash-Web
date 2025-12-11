<!-- components/player/PlayerName.vue -->
<script setup lang="ts">
import { VTooltip } from 'vuetify/components';

const props = withDefaults(
  defineProps<{
    name: string;
    neon?: boolean;
  }>(),
  {
    neon: false,
  },
);
</script>

<template>
  <VTooltip :text="name" location="top">
    <template #activator="{ props: tooltipProps }">
      <span
        v-bind="tooltipProps"
        class="player-name text-center text-truncate"
        :class="{ 'player-name--neon': neon }"
      >
        {{ name }}
      </span>
    </template>
  </VTooltip>
</template>

<style scoped>
.player-name {
  font-family: "Rajdhani", sans-serif;
  font-size: 40px;
  font-weight: 400;
  color: #ffffff;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 180px;
  letter-spacing: 0.5px;
  transition: 0.2s ease;
}

.player-name--neon {
  text-shadow:
    0 1px 0 rgba(0,0,0,0.2),
    0 1px 6px rgba(158, 75, 223, 0.8),
    0 0 14px rgba(158, 75, 223, 0.75);
}

/* responsive */
@media (max-width: 1200px) {
  .player-name { font-size: 36px; }
}

@media (max-width: 1024px) {
  .player-name { font-size: 32px; }
}

@media (max-width: 768px) {
  .player-name { font-size: 28px; max-width: 150px; }
}

@media (max-width: 480px) {
  .player-name { font-size: 24px; max-width: 130px; }
}

@media (max-height: 600px) and (orientation: landscape) {
  .player-name { font-size: 22px; max-width: 120px; }
}

@media (max-height: 500px) and (orientation: landscape) {
  .player-name { font-size: 20px; max-width: 110px; }
}

@media (max-height: 400px) and (orientation: landscape) {
  .player-name { font-size: 18px; max-width: 100px; }
}
</style>
