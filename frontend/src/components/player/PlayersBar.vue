<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { VRow, VCol } from 'vuetify/components';

import ActionLimits from './ActionLimits.vue';
import ScoresBox from './ScoresBox.vue';
import PlayerAvatar from './PlayerAvatar.vue';
import PlayerName from './PlayerName.vue';

import frameImg from '@/assets/images/frames/frame.png';
import type {
  WebGameState,
  AllowedActionsView,
  ActionLimitsView,
} from '../../types/WebGameState';
import type { PlayerAvatarRegistry } from '../../utils/playerAvatarRegistry';

const props = defineProps<{
  web: WebGameState | null;
  avatarRegistry: PlayerAvatarRegistry;
}>();

function toNum(x: unknown, fallback: number): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

const seat1Name = ref<string>('Player 1');
const seat2Name = ref<string>('Player 2');
const seatsInitialized = ref(false);

const STORAGE_KEY = 'scc-player-seats-v1';

interface StoredSeats {
  seat1Name: string;
  seat2Name: string;
}

function loadStoredSeats(): StoredSeats | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSeats;
  } catch {
    return null;
  }
}

function storeSeats(seat1: string, seat2: string): void {
  try {
    const payload: StoredSeats = { seat1Name: seat1, seat2Name: seat2 };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function storedMatchesCurrentGame(st: WebGameState, stored: StoredSeats): boolean {
  const rAtt = st.roles?.attacker ?? null;
  const rDef = st.roles?.defender ?? null;
  const currentNames = [rAtt, rDef].filter((n): n is string => !!n);

  return (
    currentNames.includes(stored.seat1Name) &&
    currentNames.includes(stored.seat2Name)
  );
}

watch(
  () => props.web,
  (st) => {
    if (!st || seatsInitialized.value) return;

    const stored = loadStoredSeats();
    if (stored && storedMatchesCurrentGame(st, stored)) {
      seat1Name.value = stored.seat1Name;
      seat2Name.value = stored.seat2Name;
      seatsInitialized.value = true;
      return;
    }

    seat1Name.value = st.roles?.attacker ?? 'Player 1';
    seat2Name.value = st.roles?.defender ?? 'Player 2';

    storeSeats(seat1Name.value, seat2Name.value);
    seatsInitialized.value = true;
  },
  { immediate: true },
);

function getRoleForSeatName(
  st: WebGameState | null,
  seatName: string,
): 'attacker' | 'defender' | null {
  if (!st) return null;
  if (st.roles?.attacker === seatName) return 'attacker';
  if (st.roles?.defender === seatName) return 'defender';
  return null;
}

function getAllowedForSeat(
  st: WebGameState | null,
  seatName: string,
): ActionLimitsView | null {
  if (!st || !st.allowed) return null;

  const allowed = st.allowed as AllowedActionsView & Record<string, any>;

  const role = getRoleForSeatName(st, seatName);
  if (role === 'attacker' && allowed.attacker) return allowed.attacker;
  if (role === 'defender' && allowed.defender) return allowed.defender;

  const nameKeyed = allowed[seatName];
  if (nameKeyed) return nameKeyed as ActionLimitsView;

  return null;
}

const seat1Allowed = computed<ActionLimitsView | null>(() => {
  const st = props.web;
  return getAllowedForSeat(st, seat1Name.value);
});

const seat2Allowed = computed<ActionLimitsView | null>(() => {
  const st = props.web;
  return getAllowedForSeat(st, seat2Name.value);
});

const seat1Score = computed(() => {
  const st = props.web;
  if (!st) return 0;

  const role = getRoleForSeatName(st, seat1Name.value);
  if (role === 'attacker') return toNum(st.scores?.attacker, 0);
  if (role === 'defender') return toNum(st.scores?.defender, 0);

  return 0;
});

const seat2Score = computed(() => {
  const st = props.web;
  if (!st) return 0;

  const role = getRoleForSeatName(st, seat2Name.value);
  if (role === 'attacker') return toNum(st.scores?.attacker, 0);
  if (role === 'defender') return toNum(st.scores?.defender, 0);
  return 0;
});

const seat1Player = computed(() => ({
  id: `seat1:${seat1Name.value}`,
  name: seat1Name.value,
  playerType: 'Human' as const,
}));

const seat2Player = computed(() => ({
  id: `seat2:${seat2Name.value}`,
  name: seat2Name.value,
  playerType: 'Human' as const,
}));

const playersBarStyle = {
  backgroundImage: `url(${frameImg})`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: '60% 325%',
  backgroundPosition: 'center',
  backgroundColor: 'transparent',
};
</script>

<template>
  <div class="players-bar" :style="playersBarStyle">
    <VRow
      class="players-bar__inner"
      align="center"
      justify="center"
      no-gutters
    >
      <VCol cols="auto" class="players-bar__avatar-col">
        <PlayerAvatar
          :player="seat1Player"
          :avatarRegistry="avatarRegistry"
          alt="Player 1 avatar"
          :neon="true"
        />
      </VCol>

      <VCol cols="auto" class="players-bar__info-col">
        <PlayerName
          :name="seat1Name"
          neon
          data-player1-name
        />

        <ActionLimits
          class="players-bar__actions"
          data-player1-actions
          :limits="seat1Allowed"
        />
      </VCol>

      <VCol cols="auto" class="players-bar__scores-col">
        <ScoresBox
          :seat1-score="seat1Score"
          :seat2-score="seat2Score"
        />
      </VCol>

      <VCol cols="auto" class="players-bar__info-col">
        <PlayerName
          :name="seat2Name"
          neon
          data-player2-name
        />

        <ActionLimits
          class="players-bar__actions"
          data-player2-actions
          :limits="seat2Allowed"
        />
      </VCol>

      <VCol cols="auto" class="players-bar__avatar-col">
        <PlayerAvatar
          :player="seat2Player"
          :avatarRegistry="avatarRegistry"
          alt="Player 2 avatar"
        />
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
:root {
  --inner-gap: 10px;
  --bar-top-margin: 25px;
}

.players-bar {
  margin-top: var(--bar-top-margin);
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 30px 0;
  box-sizing: border-box;
}

.players-bar__inner {
  width: fit-content;
  max-width: 95%;
  gap: var(--inner-gap);
}

.players-bar__avatar-col {
  display: flex;
  justify-content: center;
}

.players-bar__info-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.players-bar__scores-col {
  display: flex;
  justify-content: center;
}

@media (max-width: 1200px) {
  :root {
    --bar-top-margin: 20px;
    --inner-gap: 8px;
  }

  .players-bar {
    padding: 25px 0;
    background-size: 65% 300%;
  }
}

@media (max-width: 1024px) {
  :root {
    --bar-top-margin: 15px;
  }

  .players-bar {
    padding: 20px 0;
    background-size: 70% 280%;
  }
}

@media (max-width: 768px) {
  :root {
    --bar-top-margin: 10px;
    --inner-gap: 6px;
  }

  .players-bar {
    padding: 15px 0;
    background-size: 80% 250%;
  }

  .players-bar__inner {
    flex-wrap: wrap;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  :root {
    --bar-top-margin: 8px;
  }

  .players-bar {
    padding: 12px 0;
    background-size: 90% 220%;
  }
}

@media (max-height: 600px) and (orientation: landscape) {
  :root {
    --bar-top-margin: 5px;
    --inner-gap: 5px;
  }

  .players-bar {
    padding: 8px 0;
    background-size: 50% 200%;
  }

  .players-bar__inner {
    gap: 8px;
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  :root {
    --bar-top-margin: 3px;
  }

  .players-bar {
    padding: 5px 0;
  }
}

@media (max-height: 400px) and (orientation: landscape) {
  :root {
    --bar-top-margin: 2px;
    --inner-gap: 4px;
  }

  .players-bar {
    padding: 4px 0;
    background-size: 45% 180%;
  }

  .players-bar__inner {
    gap: 6px;
  }
}
</style>
