<!-- frontend/src/views/AttackerDefendersView.vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useOverlay } from '../composables/useOverlay';
import { useAttackerDefenders } from '../composables/useAttackerDefenders';
import AttackerBar from '../components/player/AttackerBar.vue';
import AttackerDefenders from '../components/field/AttackerDefenders.vue';
import FieldControls from '../components/field/FieldControls.vue';
import { createPlayerAvatarRegistry } from '../utils/playerAvatarRegistry';
import type { WebGameState } from '../types/WebGameState';
import attackerBg from '@/assets/images/frames/background6.jpg';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

const { show, hide } = useOverlay();

const {
  gameContext,
  defenders,
  goalkeeper,
  selectedTarget,
  canBoost,
  init,
  doBoost,
  busy,
} = useAttackerDefenders();

const webState = computed<WebGameState | null>(() => {
  return gameContext.state.value as WebGameState | null;
});

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
  router.push({ name: 'PlayingField', query: route.query });
}

onMounted(async () => {
  await init();
});

const sceneStyle = computed(() => ({
  backgroundImage: `url(${attackerBg})`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center center',
}));

</script>

<template>
  <div
    class="scene scene--attacker-defenders is-active"
    aria-live="polite"
    :style="sceneStyle"
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

<style scoped>
  html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.scene--attacker-defenders {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  font-family: "Rajdhani", Arial, sans-serif;
  color: #e8eef5;
  overflow: hidden;
}

.scene--attacker-defenders > * { position: relative; z-index: 1; }

#attacker-bar {
  width: min(1100px, 94vw);
  margin: clamp(8px, 2vh, 18px) auto 2px;
}

.scene__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: clamp(12px, 2vw, 20px);
  box-sizing: border-box;
}

.overlay-root:empty { pointer-events: none; }

#scene-root, .container, .content-container { margin: 0; padding: 0; height: 100%; }

@media (max-width: 768px) {
  .scene__center { gap: 16px; padding: 12px; }
  .scene__buttons { gap: 10px; }
}
</style>