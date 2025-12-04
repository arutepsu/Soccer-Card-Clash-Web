<!-- frontend/src/views/AttackerDefendersView.vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useOverlay } from '../composables/useOverlay';
import { useAttackerDefenders } from '../composables/useAttackerDefenders';
import AttackerBar from '../components/AttackerBar.vue';
import AttackerDefenders from '../components/AttackerDefenders.vue';
import FieldControls from '../components/FieldControls.vue';
import { createPlayerAvatarRegistry } from '../utils/playerAvatarRegistry';
import type { WebGameState } from '../types/WebGameState';

const router = useRouter();

// ✅ new store-based overlay
const { show, hide } = useOverlay();

const {
  gameContext,
  defenders,
  goalkeeper,
  selectedTarget,
  canBoost,
  init,
  doBoost,
} = useAttackerDefenders();

const webState = computed<WebGameState | null>(() => {
  return gameContext.state.value as WebGameState | null;
});
const busy = computed(() => gameContext.loading.value);

const avatarRegistry = createPlayerAvatarRegistry({
  avatarsPath: '/assets/images/players/',
  fileNames: [
    'player1.jpg',
    'player2.jpg',
    'ai.jpg',
    'taka.jpg',
    'defendra.jpg',
    'bitstrom.jpg',
    'meta.jpg',
  ],
});

function showAlert(message: string, autoHideMs = 3000) {
  show({
    title: 'Info',
    message,
    content: null,
  });

  if (autoHideMs > 0) {
    window.setTimeout(() => {
      hide();
    }, autoHideMs);
  }
}

async function onBoost() {
  try {
    await doBoost();
  } catch (err: any) {
    if (err?.code === 'BOOST_NOT_AVAILABLE') {
      showAlert('Boost is not available for the current attacker right now.');
    } else if (err?.code === 'NO_TARGET_SELECTED') {
      showAlert('Pick one of your defenders or the goalkeeper to boost.');
    } else {
      console.error('[AttackerDefendersView] Boost failed', err);
      showAlert('Boost failed. Please try again.');
    }
  }
}

function onInfo() {
  showAlert(
    'Boost temporarily increases the selected defender or goalkeeper.',
    3000,
  );
}

function onBack() {
  router.push({ name: 'PlayingField' });
}

onMounted(async () => {
  await init();
});
</script>

<template>
  <div
    class="scene scene--attacker-defenders is-active"
    aria-live="polite"
  >
    <section
      id="attacker-bar"
      aria-label="Current Attacker"
      class="scene-header"
    >
      <AttackerBar
        :web="webState"
        :avatarRegistry="avatarRegistry"
      />
    </section>

    <div class="scene__center">
      <div
        id="attacker-defenders-field"
        class="players-field players-field--attacker"
        aria-label="Attacker defenders and goalkeeper"
      >
        <AttackerDefenders
          :defenders="defenders"
          :goalkeeper="goalkeeper"
          v-model:selectedTarget="selectedTarget"
        />
      </div>

      <FieldControls
        :busy="busy"
        :canBoost="canBoost"
        @boost="onBoost"
        @info="onInfo"
        @back="onBack"
      />
    </div>
  </div>
</template>
