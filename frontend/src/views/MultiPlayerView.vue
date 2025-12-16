<!-- frontend/src/views/MultiplayerView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import { setPlayers } from '../utils/playerSideRegistry';
import { useOverlay } from '../composables/useOverlay';
import { useGameCommands } from '../composables/useGameCommands';
import GameButton from '../components/button/GameButton.vue';
import GlitchInput from '../components/input-field/GlitchInput.vue';
import GameLogo from '../components/logo/GameLogo.vue';
import multiBg from '@/assets/images/frames/background2.jpg';

const router = useRouter();
const { startLocalMultiplayer } = useGameCommands();
const { show, hide } = useOverlay();

const player1 = ref('');
const player2 = ref('');
const busy = ref(false);

const soundManager: SoundManager = createSoundManager({
  basePath: '/assets/sounds/',
});

soundManager.preload('hover', 'hover.wav');
soundManager.preload('click', 'attack.wav');

function onButtonHover() {
  soundManager.play('hover', { volume: 0.3 });
}

function onButtonClick() {
  soundManager.play('click', { volume: 0.6 });
}

function trim(v: string): string {
  return v.trim();
}

function showAlert(msg: string): void {
  show({
    title: 'Info',
    message: msg,
    content: null,
  });

  window.setTimeout(() => {
    hide();
  }, 2500);
}

function validate(): boolean {
  const v1 = trim(player1.value);
  const v2 = trim(player2.value);

  setPlayers(v1, v2);

  if (!v1 || !v2) {
    showAlert('Please enter both player names.');
    return false;
  }
  if (v1.length > 40 || v2.length > 40) {
    showAlert('Names should be 40 characters or fewer.');
    return false;
  }
  return true;
}

async function onSubmit() {
  if (!validate()) return;

  busy.value = true;
  onButtonClick();

  try {
  await startLocalMultiplayer(player1.value, player2.value);
    await router.push({ name: 'PlayingField' });
  } catch (err) {
    console.error('[MultiplayerView] restart failed:', err);
    showAlert('Could not create game, please try again.');
  } finally {
    busy.value = false;
  }
}

function goBack() {
  onButtonClick();
  router.push({ name: 'MainMenu' });
}

type MultiAction = 'start' | 'back';

function onCommand(payload: { action: MultiAction }) {
  switch (payload.action) {
    case 'start':
      onSubmit();
      break;
    case 'back':
      goBack();
      break;
  }
}

function onHover(payload: { action: MultiAction; hovering: boolean }) {
  if (payload.hovering) {
    onButtonHover();
  }
}

const multiSceneStyle = {
  backgroundImage: `url(${multiBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

</script>

<template>
  <div
    class="scene scene--create-multiplayer is-active"
    aria-hidden="false"
    :style="multiSceneStyle"
  >
    <div class="panel create-player-panel">
      <GameLogo />

      <div class="titles">
        <h1 class="title">Create Players</h1>
        <p class="subtitle">Enter Player Names</p>
      </div>

      <form class="create-player-form" @submit.prevent="onSubmit">
        <div class="inputs">
          <GlitchInput
            v-model="player1"
            id="player1"
            label="Player 1"
            autocomplete="off"
          />

          <GlitchInput
            v-model="player2"
            id="player2"
            label="Player 2"
            autocomplete="off"
          />
        </div>

        <div class="buttons">
          <GameButton
            action="start"
            label="Start"
            :busy="busy"
            :class="{ 'is-busy': busy }"
            tooltip="Start the local multiplayer game"
            @command="onCommand"
            @hover="onHover"
          />

          <GameButton
            action="back"
            label="Back"
            class="gbtn--secondary"
            tooltip="Back to main menu"
            @command="onCommand"
            @hover="onHover"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
:root {
  --gold: #FFD700;
  --ink: #0F0030;
  --violet: #5F3FFC;
  --text: #f0e9fa;
}

.scene--create-multiplayer {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;

  font-family: "Rajdhani", Arial, sans-serif;
  overflow-y: auto;
}

.panel.create-player-panel {
  width: min(92vw, 560px);
  min-height: 560px;
  padding: 20px 16px;
  border-radius: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.titles {
  text-align: center;
  margin-top: 0px;
}

.title {
  font-size: clamp(38px, 7vw, 68px);
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 8px;
  text-shadow:
    0 0 10px #00ff41,
    0 0 20px #00ff41,
    0 0 40px #00ff41;
  animation: titleGlitch 2s ease-in-out infinite;
  margin-bottom: 20px;
  line-height: 1.05;
}

@keyframes titleGlitch {
  0%, 90%, 100% {
    transform: translate(0);
    filter: hue-rotate(0deg);
  }
  10% {
    transform: translate(-2px, 2px);
    filter: hue-rotate(90deg);
  }
  20% {
    transform: translate(2px, -2px);
    filter: hue-rotate(180deg);
  }
  30% {
    transform: translate(-2px, -2px);
    filter: hue-rotate(270deg);
  }
  40% {
    transform: translate(2px, 2px);
    filter: hue-rotate(360deg);
  }
}

.subtitle {
  font-size: clamp(16px, 2.4vw, 22px);
  font-weight: 700;
  color: var(--gold);
  margin: 4px 0 0 0;
  letter-spacing: 3px;
  text-transform: uppercase;
  opacity: 0.8;
  animation: subtitleFlicker 1.5s ease-in-out infinite;
}

@keyframes subtitleFlicker {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.inputs {
  width: 100%;
  margin-top: 6px;
  display: grid;
  gap: 10px;
  place-items: center;
}

.buttons {
  display: grid;
  gap: 0px;
  place-items: center;
  margin-top: 0px;
}

.gbtn.gbtn--secondary {
  opacity: 0.9;
  margin-top: -50px;
}

@media (max-width: 576px) {
  .scene--create-multiplayer {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }

  .panel.create-player-panel {
    width: min(96vw, 560px);
    min-height: unset;
    padding: 16px 12px;
    border-radius: 20px;
    gap: 14px;
  }

  .logo-image {
    width: min(70vw, 360px);
    max-width: 360px;
    margin-top: -20px;
  }

  .inputs {
    gap: 12px;
    margin-top: 4px;
  }

  .buttons {
    gap: 14px;
    margin-top: 4px;
  }

  .gbtn {
    --btn-w: 320px !important;
    --btn-h: 96px !important;
    font-size: 1.8rem !important;
  }

  .gbtn.gbtn--secondary {
    margin-top: -20px;
  }

  .overlay__content {
    width: min(94vw, 420px);
    padding: 20px;
  }

  .overlay__content p {
    font-size: 16px;
  }
}

@media (min-width: 577px) and (max-width: 768px) {
  .panel.create-player-panel {
    width: min(94vw, 600px);
    padding: 20px 16px;
    border-radius: 28px;
    gap: 16px;
  }

  .logo-image {
    width: min(40vw, 420px);
    max-width: 420px;
    margin-top: -28px;
  }

  .buttons {
    gap: 12px;
  }

  .gbtn {
    --btn-w: 320px !important;
    --btn-h: 88px !important;
    font-size: 1.6rem !important;
  }

  .gbtn.gbtn--secondary {
    margin-top: -36px;
  }
}

@media (min-width: 1200px) {
  .panel.create-player-panel {
    width: 560px;
  }
  .logo-image {
    max-width: 500px;
  }
}
</style>
