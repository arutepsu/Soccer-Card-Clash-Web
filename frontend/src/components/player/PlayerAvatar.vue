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

<style scoped>
.player__avatar {
  width: clamp(52px, 8vw, 100px);
  height: auto;
  border-radius: 8px;
  object-fit: contain;
  display: block;
}

@media (max-width: 1200px) {
  .player__avatar { width: 85px; }
}

@media (max-width: 1024px) {
  .player__avatar { width: 75px; }
}

@media (max-width: 768px) {
  .player__avatar { width: 65px; }
}

@media (max-width: 480px) {
  .player__avatar { width: 55px; }
}

@media (max-height: 600px) and (orientation: landscape) {
  .player__avatar { width: 45px; }
}

@media (max-height: 500px) and (orientation: landscape) {
  .player__avatar { width: 38px; }
}

@media (max-height: 400px) and (orientation: landscape) {
  .player__avatar { width: 34px; }
}
</style>
