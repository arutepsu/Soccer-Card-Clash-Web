<!-- frontend/src/components/PlayersBar.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type {
  WebGameState,
  AllowedActionsView,
  ActionLimitsView,
} from '../types/WebGameState';


interface AvatarPlayer {
  id: string;
  name?: string | null;
}

export interface AvatarRegistry {
  getAvatarUrl(player: AvatarPlayer): string | null | undefined;
}

const props = defineProps<{
  web: WebGameState | null;
  avatarRegistry: AvatarRegistry;
}>();

function toNum(x: unknown, fallback: number): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function formatAllowed(lim?: ActionLimitsView | null): string {
  if (!lim) {
    return `Swap: 0\nBoost: 0\nDoubleAttack: 0`;
  }
  const swap = toNum(lim.swapRemaining, 0);
  const boost = toNum(lim.boostRemaining, 0);
  const da = toNum(lim.doubleAttackRemaining, 0);
  return `Swap: ${swap}\nBoost: ${boost}\nDoubleAttack: ${da}`;
}

const attackerName = computed(() => props.web?.roles?.attacker ?? '');
const defenderName = computed(() => props.web?.roles?.defender ?? '');

const attackerScore = computed(() =>
  toNum(props.web?.scores?.attacker, 0),
);
const defenderScore = computed(() =>
  toNum(props.web?.scores?.defender, 0),
);

const attackerAllowed = computed<ActionLimitsView | undefined>(() => {
  const allowed: AllowedActionsView | undefined = props.web?.allowed;
  return allowed?.attacker;
});

const defenderAllowed = computed<ActionLimitsView | undefined>(() => {
  const allowed: AllowedActionsView | undefined = props.web?.allowed;
  return allowed?.defender;
});

const attackerActionsText = computed(() =>
  formatAllowed(attackerAllowed.value),
);
const defenderActionsText = computed(() =>
  formatAllowed(defenderAllowed.value),
);

const attackerAvatarUrl = computed(() => {
  try {
    return (
      props.avatarRegistry.getAvatarUrl({
        id: 'att',
        name: attackerName.value,
      }) ?? undefined
    );
  } catch {
    return undefined;
  }
});

const defenderAvatarUrl = computed(() => {
  try {
    return (
      props.avatarRegistry.getAvatarUrl({
        id: 'def',
        name: defenderName.value,
      }) ?? undefined
    );
  } catch {
    return undefined;
  }
});
</script>

<template>
  <div class="players-bar">
    <div class="players-bar__inner">
      <div class="player-avatar-box">
        <img
          class="player__avatar"
          data-attacker-avatar
          alt="Attacker avatar"
          v-if="attackerAvatarUrl"
          :src="attackerAvatarUrl"
          decoding="async"
          loading="lazy"
        />
      </div>

      <div class="player-info">
        <div
          class="player-name"
          data-attacker-name
        >
          {{ attackerName }}
        </div>
        <pre
          class="player-actions"
          data-attacker-actions
        >{{ attackerActionsText }}</pre>
      </div>

      <div class="score-box">
        <div class="scores-title">Scores</div>
        <div class="score-row">
          <span
            class="player-score"
            data-attacker-score
          >
            {{ attackerScore }}
          </span>
          <span class="spacer"></span>
          <span
            class="player-score"
            data-defender-score
          >
            {{ defenderScore }}
          </span>
        </div>
      </div>

      <div class="player-info">
        <div
          class="player-name"
          data-defender-name
        >
          {{ defenderName }}
        </div>
        <pre
          class="player-actions"
          data-defender-actions
        >{{ defenderActionsText }}</pre>
      </div>

      <div class="player-avatar-box">
        <img
          class="player__avatar"
          data-defender-avatar
          alt="Defender avatar"
          v-if="defenderAvatarUrl"
          :src="defenderAvatarUrl"
          decoding="async"
          loading="lazy"
        />
      </div>
    </div>
  </div>
</template>
