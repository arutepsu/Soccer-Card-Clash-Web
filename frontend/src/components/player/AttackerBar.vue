<script setup lang="ts">
import { computed } from 'vue';
import type {
  WebGameState,
  PlayerLike,
  ActionLimitsView,
} from '../../types/WebGameState';
import PlayerAvatar from './PlayerAvatar.vue';
import type { PlayerAvatarRegistry } from '../../utils/playerAvatarRegistry';
import ActionLimits from './ActionLimits.vue';

const props = defineProps<{
  web: WebGameState | null | undefined;
  avatarRegistry: PlayerAvatarRegistry;
}>();

const attacker = computed<PlayerLike | null>(() => {
  const st = props.web;
  if (!st) return null;

  const pa = (st as any)?.players?.attacker as PlayerLike | undefined;
  if (pa) return pa;

  const name = st.roles.attacker ?? 'Attacker';
  return {
    id: `att:${name}`,
    name,
    playerType: 'Human',
  } as PlayerLike;
});

const allowedForAttacker = computed<Partial<ActionLimitsView>>(() => {
  const st = props.web;
  const att = attacker.value;
  if (!st || !att) return {};

  const base = st.allowed?.attacker as Partial<ActionLimitsView> | undefined;
  const keyed = (st.allowed as any)?.[att.id] as
    | Partial<ActionLimitsView>
    | undefined;

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
</script>

<template>
  <div class="attacker-bar">
    <div class="attacker-bar__inner">
      <div class="attacker-avatar-col">
        <PlayerAvatar
          :player="attacker"
          :avatarRegistry="avatarRegistry"
          alt="Attacker avatar"
          :neon="true"
        />
      </div>

      <div class="player-info">
        <div class="player-name" data-attacker-name>
          {{ attackerName }}
        </div>
        <ActionLimits
          data-attacker-actions
          :limits="allowedForAttacker"
        />
      </div>
    </div>
  </div>
</template>
