<!-- frontend/src/components/PlayersHand.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import HandCard from './HandCard.vue';
import type { SceneView } from '../scenes/playingField/sceneMapping';
import type { HandCardLike } from '../types/HandCards';

const props = defineProps<{
  scene: SceneView | null;
  busy?: boolean;
}>();

const attackerHand = computed<HandCardLike[]>(() => {
  const s: any = props.scene;
  if (!s) return [];

  const fromHands =
    s?.gameCards?.hands?.att ??
    s?.cards?.hands?.att ??
    s?.cards?.attackerHand;

  return (fromHands ?? []) as HandCardLike[];
});

const overlap = computed(() => {
  const n = attackerHand.value.length;
  if (n <= 1) return 0;
  if (n >= 10) return -60;
  if (n >= 6) return -50;
  return -30;
});
</script>

<template>
  <div class="players-hand-bar">
    <div
      class="hand-row-inner"
      role="listbox"
      aria-label="Attacker hand"
      :aria-disabled="busy ? 'true' : 'false'"
    >
      <HandCard
        v-for="(card, index) in attackerHand"
        :key="card.fileName ?? index"
        :card="card"
        :index="index"
        :overlap="overlap"
        :selected="false"
        :clickable="false"
      />
    </div>
  </div>
</template>
