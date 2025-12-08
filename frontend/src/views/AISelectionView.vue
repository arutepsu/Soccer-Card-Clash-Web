<!-- frontend/src/views/AISelectionView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameContext } from '../composables/useGameContext';
import GameButton from '../components/button/GameButton.vue';

//fix later!
const router = useRouter();
const game = useGameContext();

const selectedAI = ref<string | null>(null);
const busy = ref(false);

const opponents = [
  {
    key: 'taka',
    name: 'Taka',
    description: 'Balanced and smart attacker.',
    img: '/assets/images/players/taka.jpg',
  },
  {
    key: 'bitstorm',
    name: 'Bitstorm',
    description: 'Aggressive, double-hitting striker.',
    img: '/assets/images/players/bitstrom.jpg',
  },
  {
    key: 'defendra',
    name: 'Defendra',
    description: 'Specialist in boosting defense.',
    img: '/assets/images/players/defendra.jpg',
  },
  {
    key: 'meta',
    name: 'MetaAI',
    description: 'Adaptive, unpredictable decision-maker.',
    img: '/assets/images/players/meta.jpg',
  },
];

function selectAI(key: string) {
  if (busy.value) return;
  selectedAI.value = key;
}

function showAlert(msg: string): void {
  alert(msg);
}

function getHumanName(): string {
  try {
    const stored = window.sessionStorage.getItem('humanPlayerName');
    const trimmed = (stored || '').trim();
    return trimmed || 'Player';
  } catch {
    return 'Player';
  }
}

function formatAiName(aiKey: string | null): string {
  if (!aiKey) return 'AI';
  return aiKey.charAt(0).toUpperCase() + aiKey.slice(1);
}

async function onStartClick() {
  if (!selectedAI.value) {
    showAlert('Please select an AI opponent first!');
    return;
  }

  const humanName = getHumanName();
  const aiPlayerName = formatAiName(selectedAI.value);

  busy.value = true;

  try {
    // await game.restart(humanName, aiPlayerName);
    await router.push({ name: 'PlayingField' });
  } catch (err) {
    console.error('[AISelectionView] Error starting game:', err);
    showAlert('Error starting the game.');
    busy.value = false;
  }
}

function onBackClick() {
  if (busy.value) return;
  router.push({ name: 'SinglePlayer' });
}

type AiSelectionAction = 'start' | 'back';

function onCommand(payload: { action: AiSelectionAction }) {
  switch (payload.action) {
    case 'start':
      onStartClick();
      break;
    case 'back':
      onBackClick();
      break;
  }
}
</script>

<template>
  <div class="scene scene--ai">
    <h1 class="header">Choose Your AI Opponent</h1>

    <div class="container-fluid">
      <div class="row justify-content-center g-3 opponents">
        <div
          v-for="op in opponents"
          :key="op.key"
          class="col-6 col-md-3"
        >
          <div
            class="card h-100"
            :data-ai="op.key"
            :class="{ 'is-selected': selectedAI === op.key }"
            @click="selectAI(op.key)"
          >
            <img
              class="card-img-top"
              :src="op.img"
              :alt="op.name"
            />
            <div class="card-body text-center">
              <h5 class="card-title">{{ op.name }}</h5>
              <p class="card-text">{{ op.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="buttons mt-4">
      <GameButton
        id="btn-start"
        action="start"
        label="Start"
        :busy="busy"
        tooltip="Start the match"
        :class="['btn btn-success btn-lg gbtn--lg', { 'is-busy': busy }]"
        @command="onCommand"
      />

      <GameButton
        action="back"
        label="Back"
        :busy="busy"
        tooltip="Back to previous screen"
        class="btn btn-secondary btn-lg gbtn--lg"
        @command="onCommand"
      />
    </div>
  </div>
</template>

<style scoped>
  html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: none !important;
}

.scene--ai {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 20px;

    font-family: "Rajdhani", Arial, sans-serif;

    background-image: url('/assets/images/frames/background8.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.scene--ai .header {
    color: #f3ca04;
    font-size: clamp(2rem, 8vw, 5rem);
    font-weight: bold;
    margin: 20px 0;
    text-shadow: 0 0 10px rgba(243, 202, 4, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6);
    text-align: center;
}

.opponents {
    /* display: flex; */
    /* justify-content: center; */
    /* align-items: stretch; */
    /* gap: 20px; */
    margin: 20px auto;
    width: 100%;
    max-width: 1200px;
    text-align: center;   
}


.card {
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #7700ff;
    border-radius: 20px;
    box-shadow: 0 0 20px #7700ff;
    transition: transform 0.3s, box-shadow 0.3s;
    width: 100%;
    max-width: 80%;
    margin: 0 auto;
}

.card:hover {
    transform: translateY(-10px);
    box-shadow: 0 0 30px #ff00ff;
}

.card-title {
    color: #ff00ff;
    font-size: 1.25rem;
}

.card-text {
    color: #ccc;
    font-size: 0.9rem;
}

.card img {
    width: 100%;
    height: auto;
    border-radius: 12px;
    margin-bottom: 15px;
    object-fit: cover;
}

.buttons {
    
    margin-bottom: 310px;
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap
    ;
}

.gbtn {
    padding: 12px 24px;
    display: inline-flex;
    align-items: center;
}

@media (max-width: 992px) {
    .scene--ai .header {
        font-size: 3rem;
    }
    .card {
        max-width: 250px;
    }
}

@media (max-width: 768px) {
    .scene--ai .header {
        font-size: 2.5rem;
    }
    .card {
        max-width: 200px;
    }
}

@media (max-width: 576px) {
    .scene--ai .header {
        font-size: 2rem;
    }
    .card {
        max-width: 170px;
    }
}
</style>