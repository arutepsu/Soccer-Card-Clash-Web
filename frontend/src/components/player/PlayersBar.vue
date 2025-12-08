<script setup lang="ts">
import ActionLimits from './ActionLimits.vue';

import { computed, ref, watch } from 'vue';
import type {
  WebGameState,
  AllowedActionsView,
  ActionLimitsView,
} from '../../types/WebGameState';
import PlayerAvatar from './PlayerAvatar.vue';
import type { PlayerAvatarRegistry } from '../../utils/playerAvatarRegistry';

const props = defineProps<{
  web: WebGameState | null;
  avatarRegistry: PlayerAvatarRegistry;
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

const seat1ActionsText = computed(() => formatAllowed(seat1Allowed.value));
const seat2ActionsText = computed(() => formatAllowed(seat2Allowed.value));

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
</script>


<template>
  <div class="players-bar">
    <div class="players-bar__inner">
      <div class="player-avatar-box">
        <PlayerAvatar
          :player="seat1Player"
          :avatarRegistry="avatarRegistry"
          alt="Player 1 avatar"
          :neon="true"
        />
      </div>

      <div class="player-info">
        <div class="player-name" data-player1-name>
          {{ seat1Name }}
        </div>
        <ActionLimits
          class="player-actions"
          data-player1-actions
          :limits="seat1Allowed"
        />
      </div>

      <div class="score-box">
        <div class="scores-title">Scores</div>
        <div class="score-row">
          <span class="player-score" data-player1-score>
            {{ seat1Score }}
          </span>
          <span class="spacer"></span>
          <span class="player-score" data-player2-score>
            {{ seat2Score }}
          </span>
        </div>
      </div>

      <div class="player-info">
        <div class="player-name" data-player2-name>
          {{ seat2Name }}
        </div>
        <ActionLimits
          class="player-actions"
          data-player2-actions
          :limits="seat2Allowed"
        />
      </div>

      <div class="player-avatar-box">
        <PlayerAvatar
          :player="seat2Player"
          :avatarRegistry="avatarRegistry"
          alt="Player 2 avatar"
        />
      </div>
    </div>
  </div>
</template>
