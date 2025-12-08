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

<style scoped>
.attacker-bar {
  background-image: url("/assets/images/frames/frame.png");
  background-repeat: no-repeat;
  background-size: 60% 325%;
  background-position: center;
  background-color: transparent;
  padding: 30px 0;
  margin-top: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.attacker-bar__inner {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 40px;
  width: min(900px, 80%);
  padding-left: 350px;
}

.attacker-bar .player-avatar-box {
  width: 115px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.attacker-bar .player__avatar.neon-avatar {
  width: 100px;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(158, 75, 223, 0.8));
}

.attacker-bar .player-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
}

.attacker-bar .player-name {
  font-family: "Rajdhani", sans-serif;
  font-size: 40px;
  font-weight: 400;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(158, 75, 223, 0.8);
}

.attacker-bar .player-actions {
  font-family: "Rajdhani", sans-serif;
  font-size: 18px;
  color: #dddddd;
  white-space: pre-line;
  line-height: 1.3;
  text-shadow: 0 1px 0 rgba(0,0,0,0.15), 0 1px 4px rgba(158, 75, 223, 0.8);
  max-width: 360px;
}
</style>