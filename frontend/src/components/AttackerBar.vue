<script setup lang="ts">
import { computed, watch } from 'vue';
import type {
  WebGameState,
  PlayerLike,
  ActionLimitsView,
} from '../types/WebGameState';

export interface AvatarRegistry {
  getAvatarFileName(player: PlayerLike): string;
  assignAvatarsInOrder(players: PlayerLike[]): void;
  getAvatarUrl(player: PlayerLike): string;
}

const props = defineProps<{
  web: WebGameState | null | undefined;
  avatarRegistry: AvatarRegistry;
}>();

const attacker = computed<PlayerLike | null>(() => {
  const st = props.web;
  if (!st) return null;

  const pa = (st as any)?.players?.attacker as PlayerLike | undefined;

  if (pa) {
    return {
      id: 'att',
      name: pa.name ?? st.roles.attacker,
      playerType: pa.playerType ?? 'Human',
    };
  }

  return {
    id: 'att',
    name: st.roles.attacker,
    playerType: 'Human',
  };
});

const allowedForAttacker = computed<Partial<ActionLimitsView>>(() => {
  const st = props.web;
  const att = attacker.value;
  if (!st || !att) return {};

  const base = st.allowed?.attacker as Partial<ActionLimitsView> | undefined;
  const keyed = (st.allowed as any)?.[att.id] as Partial<ActionLimitsView> | undefined;

  return base ?? keyed ?? {};
});

const actionsText = computed(() => {
  const lim = allowedForAttacker.value;

  const toNum = (x: unknown, fallback = 0): number =>
    Number.isFinite(Number(x)) ? Number(x) : fallback;

  const swap = toNum((lim as any).swapRemaining, 0);
  const boost = toNum((lim as any).boostRemaining, 0);
  const da = toNum((lim as any).doubleAttackRemaining, 0);

  return `Swap: ${swap}\nBoost: ${boost}\nDoubleAttack: ${da}`;
});

const attackerName = computed(() => attacker.value?.name ?? 'Attacker');

watch(
  attacker,
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

const avatarUrl = computed(() => {
  const att = attacker.value;
  if (!att) return '';
  try {
    return props.avatarRegistry.getAvatarUrl(att);
  } catch {
    return '';
  }
});

const attackerInitial = computed(() =>
  (attackerName.value || 'A').charAt(0).toUpperCase(),
);
</script>

<template>
  <div class="attacker-bar">
    <div class="attacker-bar__inner">
      <div class="attacker-avatar-col">
        <div class="player-avatar-box">
          <img
            v-if="avatarUrl"
            class="player__avatar neon-avatar"
            :src="avatarUrl"
            alt="Attacker avatar"
          />
          <div
            v-else
            class="player__avatar player__avatar--fallback"
            aria-hidden="true"
          >
            {{ attackerInitial }}
          </div>
        </div>
      </div>

      <div class="player-info">
        <div class="player-name" data-attacker-name>
          {{ attackerName }}
        </div>
        <pre class="player-actions" data-attacker-actions>
{{ actionsText }}
        </pre>
      </div>
    </div>
  </div>
</template>