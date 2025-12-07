<script setup lang="ts">
import { computed, watch } from 'vue';
import type { PlayerLike } from '../types/WebGameState';
import type { PlayerAvatarRegistry } from '../utils/playerAvatarRegistry';

const props = withDefaults(
  defineProps<{
    player: PlayerLike | null | undefined;
    avatarRegistry: PlayerAvatarRegistry;
    alt?: string;
    neon?: boolean;
  }>(),
  {
    alt: 'Player avatar',
    neon: false,
  },
);

const playerName = computed(() => props.player?.name ?? 'Player');

const initial = computed(() =>
  (playerName.value || 'P').charAt(0).toUpperCase(),
);

const avatarUrl = computed(() => {
  const p = props.player;
  if (!p) return '';
  try {
    return props.avatarRegistry.getAvatarUrl(p);
  } catch {
    return '';
  }
});

watch(
  () => props.player,
  (next) => {
    if (!next) return;

    try {
      props.avatarRegistry.getAvatarFileName(next);
    } catch {
      props.avatarRegistry.assignAvatarsInOrder([next]);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="player-avatar-box">
    <img
      v-if="avatarUrl"
      class="player__avatar"
      :class="{ 'neon-avatar': neon }"
      :src="avatarUrl"
      :alt="alt"
    />
    <div
      v-else
      class="player__avatar player__avatar--fallback"
      aria-hidden="true"
    >
      {{ initial }}
    </div>
  </div>
</template>
