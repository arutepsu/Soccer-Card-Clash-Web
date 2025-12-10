<script setup lang="ts">
import { computed, watch } from 'vue';
import type { PlayerLike } from '../../types/WebGameState';
import type { PlayerAvatarRegistry } from '../../utils/playerAvatarRegistry';

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
  const reg = props.avatarRegistry;
  if (!p || !reg) return '';
  try {
    return reg.getAvatarUrl(p);
  } catch (e) {
    console.warn('[PlayerAvatar] getAvatarUrl failed', p, e);
    return '';
  }
});

watch(
  () => [props.player, props.avatarRegistry] as const,
  ([next, reg]) => {
    if (!next || !reg) return;

    try {
      reg.getAvatarFileName(next);
    } catch {
      try {
        reg.assignAvatarsInOrder([next]);
      } catch (e) {
        console.warn('[PlayerAvatar] assignAvatarsInOrder failed', e);
      }
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
