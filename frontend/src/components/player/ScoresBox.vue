<template>
  <div class="score-box">
    <div class="scores-title text-uppercase">
      SCORES
    </div>

    <VRow
      class="score-row"
      align="center"
      justify="center"
      no-gutters
    >
      <VCol cols="auto" class="text-right">
        <span class="player-score" data-player1-score>
          {{ seat1Score }}
        </span>
      </VCol>

      <VCol cols="auto" class="text-center">
        <span class="score-colon">:</span>
      </VCol>

      <VCol cols="auto" class="text-left">
        <span class="player-score" data-player2-score>
          {{ seat2Score }}
        </span>
      </VCol>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import { VRow, VCol } from 'vuetify/components';

const props = defineProps<{
  seat1Score: number | string;
  seat2Score: number | string;
}>();
</script>

<style scoped>
.score-box {
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 180px;
}

/* TITLE – bigger now */
.scores-title {
  font-family: "Rajdhani", sans-serif;
  font-size: 22px; /* adjust if you want even bigger */
  font-weight: 700;
  color: #dddddd;
  text-align: center;
  text-shadow:
    0 1px 0 rgba(0, 0, 0, 0.15),
    0 1px 4px rgba(158, 75, 223, 0.8);
}

/* ROW */
.score-row {
  width: 100%;
  margin-top: 2px;
}

/* NUMBERS + COLON */
.player-score,
.score-colon {
  font-family: "Rajdhani", sans-serif;
  font-size: 70px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.75);
}

/* colon just a hair smaller + pulls numbers closer */
.score-colon {
  font-size: 64px;
  margin: 0 4px;
}

.player-score {
  transition: transform 0.2s ease, color 0.3s ease;
}

.player-score.updated {
  transform: scale(1.12);
  color: #fffcb3;
}

/* responsive */
@media (max-width: 1200px) {
  .score-box { min-width: 200px; }
  .player-score,
  .score-colon { font-size: 52px; }
}

@media (max-width: 1024px) {
  .score-box { min-width: 180px; }
  .player-score,
  .score-colon { font-size: 48px; }
}

@media (max-width: 768px) {
  .score-box { min-width: 160px; }
  .player-score,
  .score-colon { font-size: 42px; }
}

@media (max-width: 480px) {
  .score-box { min-width: 140px; }
  .player-score,
  .score-colon { font-size: 36px; }
}

@media (max-height: 600px) and (orientation: landscape) {
  .score-box { min-width: 120px; gap: 3px; }
  .player-score,
  .score-colon { font-size: 32px; }
}

@media (max-height: 500px) and (orientation: landscape) {
  .score-box { min-width: 100px; }
  .player-score,
  .score-colon { font-size: 28px; }
}

@media (max-height: 400px) and (orientation: landscape) {
  .score-box { min-width: 92px; gap: 2px; }
  .player-score,
  .score-colon { font-size: 24px; }
}
</style>
