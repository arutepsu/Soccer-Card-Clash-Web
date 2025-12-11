<!-- frontend/src/components/AttackerBar.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { VRow, VCol } from 'vuetify/components';

import type {
  WebGameState,
  PlayerLike,
  ActionLimitsView,
} from '../../types/WebGameState';

import PlayerAvatar from './PlayerAvatar.vue';
import PlayerName from './PlayerName.vue';
import ActionLimits from './ActionLimits.vue';
import type { PlayerAvatarRegistry } from '../../utils/playerAvatarRegistry';
import frame from '@/assets/images/frames/frame.png';

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

const attackerName = computed(() => attacker.value?.name ?? 'Attacker');

const attackerBarStyle = computed(() => ({
  backgroundImage: `url(${frame})`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: '50% 325%',
  backgroundPosition: 'center',
  backgroundColor: 'transparent',
}));
</script>

<template>
  <div class="attacker-bar" :style="attackerBarStyle">
    <VRow
      class="attacker-bar__inner"
      align="center"
      justify="center"
      no-gutters
    >
      <VCol cols="auto" class="attacker-avatar-col">
        <PlayerAvatar
          :player="attacker"
          :avatarRegistry="avatarRegistry"
          alt="Attacker avatar"
          :neon="true"
        />
      </VCol>

      <VCol cols="auto" class="attacker-info-col">
        <PlayerName
          :name="attackerName"
          neon
          data-attacker-name
        />

        <ActionLimits
          class="attacker-actions"
          data-attacker-actions
          :limits="allowedForAttacker"
        />
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.attacker-bar {
  padding: 30px 0;
  margin-top: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.attacker-bar__inner {
  width: min(900px, 80%);
  /* if you still want a slight right shift, use padding-left;
     otherwise, leave centered */
  padding-right: 150px;
}

/* avatar column tweaks */
.attacker-avatar-col .player-avatar-box {
  width: 115px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attacker-avatar-col .player__avatar.neon-avatar {
  width: 100px;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(158, 75, 223, 0.8));
}

/* info column */
.attacker-info-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

/* ActionLimits gets base styling from its own component;
   here we can just constrain width if needed */
.attacker-actions {
  max-width: 360px;
}

/* responsive tweaks */
@media (max-width: 1024px) {
  .attacker-bar {
    padding: 24px 0;
  }
  .attacker-bar__inner {
    width: min(800px, 90%);
  }
}

@media (max-width: 768px) {
  .attacker-bar__inner {
    width: 100%;
    padding-inline: 16px;
  }
  .attacker-info-col {
    align-items: center;
    text-align: center;
  }
  .attacker-actions {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .attacker-bar {
    padding: 18px 0;
  }
}
</style>
