<script setup lang="ts">
import ActionLimits from './ActionLimits.vue';
import ScoresBox from './ScoresBox.vue';

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

      <ScoresBox
        :seat1-score="seat1Score"
        :seat2-score="seat2Score"
      />

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

<style scoped>
/* :root {
  --avatar-box-size: 140px;
  --avatar-scale: 0.9;
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

  background-image: url("/assets/images/frames/frame.png");
  background-repeat: no-repeat;
  background-size: 60% 325%;
  background-position: center;
  background-color: transparent;

  font-family: "Rajdhani", sans-serif;
  box-sizing: border-box;
}

.players-bar__inner {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: var(--inner-gap);
  width: fit-content;
  max-width: 95%;
}

.player-avatar-box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;

  width: 115px;
  background: none;
  box-shadow: none;
  padding: 0;
  margin: 0;
  z-index: 5;
}

.player__avatar {
  width: clamp(52px, 8vw, 100px);
  height: auto;
  border-radius: 8px;
  object-fit: contain;
  display: block;
}


.scores-title {
  font-family: "Rajdhani", sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #dddddd;
  text-align: center;
  text-shadow: 0 1px 0 rgba(0,0,0,0.15),
               0 1px 4px rgba(158, 75, 223, 0.8);
}

.player-name {
  font-family: "Rajdhani", sans-serif;
  font-size: 40px;
  font-weight: 400;
  color: #ffffff;
}

.player-actions {
  font-family: "Rajdhani", sans-serif;
  font-size: 18px;
  color: #dddddd;
  text-align: center;
  white-space: pre-line;
  text-shadow: 0 1px 0 rgba(0,0,0,0.15),
               0 1px 4px rgba(158, 75, 223, 0.8);
}

.player-score {
  font-family: "Rajdhani", sans-serif;
  font-size: 58px;
  font-weight: 700;
  color: #FFD700;
  text-shadow: 2px 2px 10px rgba(0,0,0,0.75);
  transition: transform 0.2s ease, color 0.3s ease;
}

.player-score.updated {
  transform: scale(1.12);
  color: #fffcb3;
}

.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 220px;
}

.score-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}
.score-row .spacer {
  flex: 1 1 auto;
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

  .player-avatar-box {
    width: 100px;
  }

  .player__avatar {
    width: 85px;
  }

  .scores-title {
    font-size: 28px;
  }

  .player-name {
    font-size: 36px;
  }

  .player-score {
    font-size: 52px;
  }

  .player-actions {
    font-size: 16px;
  }

  .score-box {
    min-width: 200px;
  }

  .score-row {
    gap: 15px;
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

  .player-avatar-box {
    width: 90px;
  }

  .player__avatar {
    width: 75px;
  }

  .scores-title {
    font-size: 26px;
  }

  .player-name {
    font-size: 32px;
  }

  .player-score {
    font-size: 48px;
  }

  .player-actions {
    font-size: 15px;
  }

  .score-box {
    min-width: 180px;
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

  .player-avatar-box {
    width: 80px;
    gap: 4px;
  }

  .player__avatar {
    width: 65px;
  }

  .scores-title {
    font-size: 22px;
  }

  .player-name {
    font-size: 28px;
  }

  .player-score {
    font-size: 42px;
  }

  .player-actions {
    font-size: 14px;
  }

  .score-box {
    min-width: 160px;
  }

  .score-row {
    gap: 10px;
    flex-wrap: wrap;
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

  .player-avatar-box {
    width: 70px;
  }

  .player__avatar {
    width: 55px;
  }

  .scores-title {
    font-size: 20px;
  }

  .player-name {
    font-size: 24px;
  }

  .player-score {
    font-size: 36px;
  }

  .player-actions {
    font-size: 13px;
  }

  .score-box {
    min-width: 140px;
  }

  .score-row {
    gap: 8px;
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

  .player-avatar-box {
    width: 60px;
    gap: 3px;
  }

  .player__avatar {
    width: 45px;
  }

  .scores-title {
    font-size: 18px;
  }

  .player-name {
    font-size: 22px;
  }

  .player-score {
    font-size: 32px;
  }

  .player-actions {
    font-size: 12px;
  }

  .score-box {
    min-width: 120px;
    gap: 3px;
  }

  .score-row {
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

  .player-avatar-box {
    width: 50px;
  }

  .player__avatar {
    width: 38px;
  }

  .scores-title {
    font-size: 16px;
  }

  .player-name {
    font-size: 20px;
  }

  .player-score {
    font-size: 28px;
  }

  .player-actions {
    font-size: 11px;
  }

  .score-box {
    min-width: 100px;
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

  .players-bar__inner { gap: 6px; }

  .player-avatar-box { width: 44px; }
  .player__avatar { width: 34px; }

  .scores-title { font-size: 14px; }
  .player-name  { font-size: 18px; }
  .player-score { font-size: 24px; }
  .player-actions { font-size: 10px; }

  .score-box { min-width: 92px; gap: 2px; }
  .score-row { gap: 6px; }
} */


</style>