<script setup lang="ts">
import { computed } from 'vue';
import type { ActionLimitsView } from '../types/WebGameState';

const props = withDefaults(
  defineProps<{
    limits?: Partial<ActionLimitsView> | null;
  }>(),
  {
    limits: null,
  },
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

<template>
  <pre class="player-actions">
{{ text }}
  </pre>
</template>
