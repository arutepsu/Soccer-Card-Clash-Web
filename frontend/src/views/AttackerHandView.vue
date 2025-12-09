<!-- frontend/src/views/AttackerHandView.vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useOverlay } from '../composables/useOverlay';
import { useAttackerHand } from '../composables/useAttackerHand';
import AttackerBar from '../components/player/AttackerBar.vue';
import AttackerHand from '../components/hand/AttackerHand.vue';
import HandControls from '../components/hand/HandControls.vue';
import { createPlayerAvatarRegistry } from '../utils/playerAvatarRegistry';
import type { WebGameState } from '../types/WebGameState';
import attackerHandBg from '@/assets/images/frames/background7.jpg';
const router = useRouter();
const { show, hide } = useOverlay();

const {
  gameContext,
  attacker,
  attackerHand,
  selectedIndex,
  init,
  doSwap,
  doReverseSwap,
} = useAttackerHand();

const webState = computed(() => gameContext.state.value as WebGameState | null);
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

function showAlert(message: string, autoHideMs = 2500) {
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

async function onSwap() {
  try {
    await doSwap();
  } catch (err: any) {
    if (err?.message === 'NO_SELECTION' || err?.code === 'NO_SELECTION') {
      showAlert('Pick a card in your hand to swap.');
    } else {
      showAlert('Swap failed. Try again.');
    }
  }
}

async function onReverseSwap() {
  try {
    await doReverseSwap();
  } catch {
    showAlert('Reverse swap failed. Try again.');
  }
}

function onInfo() {
  showAlert('Select a card then choose a swap action.', 3000);
}

function onBack() {
  router.push({ name: 'PlayingField' });
}

onMounted(async () => {
  await init();
});
const sceneStyle = computed(() => ({
  backgroundImage: `url(${attackerHandBg})`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center center',
}));
</script>


<template>
  <div
    class="scene scene--attackerhand scene--attacker-hand is-active"
    aria-live="polite"
    :style="sceneStyle"
  >
    <section
      id="attacker-bar"
      class="scene-header"
      aria-label="Current Attacker"
    >
      <AttackerBar
        :web="webState"
        :avatarRegistry="avatarRegistry"
      />
    </section>

    <div class="scene__center">
      <section
        class="players-hand-bar selectable-hand-bar"
        aria-label="Your Hand"
      >
        <AttackerHand
          :hand="attackerHand"
          :attackerName="attacker?.name ?? null"
          v-model:selectedIndex="selectedIndex"
        />
      </section>

      <HandControls
        :busy="busy"
        @swap="onSwap"
        @reverse-swap="onReverseSwap"
        @info="onInfo"
        @back="onBack"
      />
    </div>
  </div>
</template>

<style scoped>
  .scene--attackerhand {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: clamp(8px, 6vw, 14px);
  padding: clamp(6px, 3vw, 16px);
  font-family: "Rajdhani", Arial, sans-serif;
  color: #e8eef5;
  overflow: hidden;
}

.scene--attackerhand .scene__center {
  display: grid;
  grid-template-rows: 1fr auto;
  align-items: center;
  justify-items: center;
  gap: clamp(12px, 2vw, 20px);
}

.scene--attackerhand .scene-header {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 72px;
}

.hand-card.is-selected {
  outline: 2px solid #7dd3fc;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.35);
  transform: translateY(-6px);
  z-index: 10;
}

.scene--attackerhand .scene__buttons {
  display: flex;
  gap: clamp(8px, 1.5vw, 18px);
  align-items: center;
  justify-content: center;
}
.gbtn.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

#attacker-bar {
  width: min(1100px, 94vw);
  margin: clamp(8px, 2vh, 18px) auto 2px;
}
</style>