<!-- frontend/src/views/AISelectionView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameContext } from '../composables/useGameContext';

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
    await game.restart(humanName, aiPlayerName);
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
      <button
        id="btn-start"
        class="btn btn-success btn-lg gbtn gbtn--lg"
        type="button"
        :disabled="busy"
        :class="{ 'is-busy': busy }"
        @click="onStartClick"
      >
        Start
      </button>

      <button
        class="btn btn-secondary btn-lg gbtn gbtn--lg"
        type="button"
        :disabled="busy"
        @click="onBackClick"
      >
        Back
      </button>
    </div>
  </div>
</template>
