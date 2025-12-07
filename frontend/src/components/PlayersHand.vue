<script setup lang="ts">
import { computed } from 'vue';
import HandCardRow from './HandCardRow.vue';
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
</script>

<template>
  <div class="players-hand-bar">
    <HandCardRow
      :cards="attackerHand"
      :selectedIndex="null"
      aria-label="Attacker hand"
      :clickable="false"
      :disabled="busy"
    />
  </div>
</template>
