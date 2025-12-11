<template>
  <VSheet
    class="player-actions-wrapper d-flex justify-center"
    color="transparent"
    elevation="0"
  >
    <pre class="player-actions mb-0">
{{ text }}
    </pre>
  </VSheet>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VSheet } from 'vuetify/components';
import type { ActionLimitsView } from './../../types/WebGameState';

const props = withDefaults(
  defineProps<{
   limits?: Partial<ActionLimitsView> | null;
  }>(),
  { limits: null },
);

function toNum(x: unknown, fallback: number): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

const text = computed(() => {
  const lim = props.limits ?? {};
  const swap = toNum((lim as any).swapRemaining, 0);
  const boost = toNum((lim as any).boostRemaining, 0);
  const da = toNum((lim as any).doubleAttackRemaining, 0);

  return `Swap: ${swap}\nBoost: ${boost}\nDoubleAttack: ${da}`;
});
</script>

<style scoped>
.player-actions-wrapper {
  background: transparent;
}

.player-actions {
  font-family: "Rajdhani", sans-serif;
  font-size: 18px;
  color: #dddddd;
  text-align: center;
  white-space: pre-line;
  text-shadow:
    0 1px 0 rgba(0, 0, 0, 0.15),
    0 1px 4px rgba(158, 75, 223, 0.8);
}

@media (max-width: 1200px) {
  .player-actions { font-size: 16px; }
}

@media (max-width: 1024px) {
  .player-actions { font-size: 15px; }
}

@media (max-width: 768px) {
  .player-actions { font-size: 14px; }
}

@media (max-height: 600px) and (orientation: landscape) {
  .player-actions { font-size: 12px; }
}

@media (max-height: 500px) and (orientation: landscape) {
  .player-actions { font-size: 11px; }
}

@media (max-height: 400px) and (orientation: landscape) {
  .player-actions { font-size: 10px; }
}
</style>
