<template>
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
</template>

<script setup lang="ts">
const props = defineProps<{
  seat1Score: number | string;
  seat2Score: number | string;
}>();
</script>

<style scoped>
/* .scores-title {
  font-family: "Rajdhani", sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #dddddd;
  text-align: center;
  text-shadow:
    0 1px 0 rgba(0, 0, 0, 0.15),
    0 1px 4px rgba(158, 75, 223, 0.8);
}

.player-score {
  font-family: "Rajdhani", sans-serif;
  font-size: 58px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.75);
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
  .scores-title {
    font-size: 28px;
  }

  .player-score {
    font-size: 52px;
  }

  .score-box {
    min-width: 200px;
  }

  .score-row {
    gap: 15px;
  }
}

@media (max-width: 1024px) {
  .scores-title {
    font-size: 26px;
  }

  .player-score {
    font-size: 48px;
  }

  .score-box {
    min-width: 180px;
  }
}

@media (max-width: 768px) {
  .scores-title {
    font-size: 22px;
  }

  .player-score {
    font-size: 42px;
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
  .scores-title {
    font-size: 20px;
  }

  .player-score {
    font-size: 36px;
  }

  .score-box {
    min-width: 140px;
  }

  .score-row {
    gap: 8px;
  }
}

@media (max-height: 600px) and (orientation: landscape) {
  .scores-title {
    font-size: 18px;
  }

  .player-score {
    font-size: 32px;
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
  .scores-title {
    font-size: 16px;
  }

  .player-score {
    font-size: 28px;
  }

  .score-box {
    min-width: 100px;
  }
}

@media (max-height: 400px) and (orientation: landscape) {
  .scores-title {
    font-size: 14px;
  }

  .player-score {
    font-size: 24px;
  }

  .score-box {
    min-width: 92px;
    gap: 2px;
  }

  .score-row {
    gap: 6px;
  }
} */
</style>
