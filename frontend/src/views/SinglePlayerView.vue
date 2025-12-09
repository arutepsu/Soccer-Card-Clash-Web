<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import { useOverlay } from '../composables/useOverlay';
import GameButton from '../components/button/GameButton.vue';
import GameLogo from '../components/logo/GameLogo.vue';
import GlitchInput from '../components/input-field/GlitchInput.vue';
import singleBg from '@/assets/images/frames/background2.jpg';

const router = useRouter();
const { show, hide } = useOverlay();

const playerName = ref('');
const busy = ref(false);

const soundManager: SoundManager = createSoundManager({
  basePath: '/assets/sounds/',
});

soundManager.preload('hover', 'hover.wav');
soundManager.preload('click', 'attack.wav');

function onButtonHover() {
  soundManager.play('hover', { volume: 0.6 });
}

function onButtonClick() {
  soundManager.play('click', { volume: 0.6 });
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

function getHumanName(): string {
  return playerName.value.trim();
}

async function onStartClick() {
  const name = getHumanName();

  if (!name) {
    showAlert('Please enter your name first.');
    return;
  }

  onButtonClick();
  busy.value = true;

  try {
    try {
      window.sessionStorage.setItem('humanPlayerName', name);
    } catch (err) {
      console.warn(
        '[SinglePlayerView] failed to store name in sessionStorage:',
        err,
      );
    }
    await router.push({ name: 'AISelection' });
  } finally {
    busy.value = false;
  }
}

function onBackClick() {
  onButtonClick();
  router.push({ name: 'MainMenu' });
}

type SinglePlayerAction = 'start' | 'back';

function onCommand(payload: { action: SinglePlayerAction }) {
  switch (payload.action) {
    case 'start':
      onStartClick();
      break;
    case 'back':
      onBackClick();
      break;
  }
}

function onHover(payload: { action: SinglePlayerAction; hovering: boolean }) {
  if (payload.hovering) {
    onButtonHover();
  }
}

const singleSceneStyle = {
  backgroundImage: `url(${singleBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

</script>

<template>
  <div
    class="scene scene--singleplayer is-active"
    aria-hidden="false"
    :style="singleSceneStyle"
  >
    <GameLogo />

    <div class="titles">
      <h1 class="title">Single Player</h1>
      <p class="subtitle">Enter Your Name</p>
    </div>

    <GlitchInput
      v-model="playerName"
      id="single-player-name"
      label="Player 1"
      autocomplete="off"
    />

    <div class="buttons">
      <GameButton
        action="start"
        label="Start"
        class="btn btn-start"
        :busy="busy"
        :class="{ 'is-busy': busy }"
        @command="onCommand"
        @hover="onHover"
      />

      <GameButton
        action="back"
        label="Back"
        class="btn btn-back"
        @command="onCommand"
        @hover="onHover"
      />
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

.scene--singleplayer {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 60px;
  font-family: "Rajdhani", Arial, sans-serif;
}

.scene--singleplayer .logo-image {
  max-width: 500px;
  width: 20vw;
  height: auto;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
  margin-bottom: 20px;
  margin-top: -40px;
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

.buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
  margin-top: 16px;
}

.gbtn.btn-back {
  margin-top: -50px;
}

.gbtn {
  background-color: #f3ca04;
  color: #000;
  padding: 0.1rem 1rem;
  border-radius: 1rem;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.2rem;
  transition: transform 0.2s, background-color 0.2s;
}

.gbtn:hover {
  background-color: #ffea6f;
  transform: scale(1.05);
}

.info-label {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  color: #39FF14;
  text-shadow: 0 0 6px #39FF14, 0 0 12px rgba(57,255,20,0.6);
  pointer-events: none;
  line-height: 1;
}

@media (max-width: 768px) {
  .scene--singleplayer .header {
    font-size: 2.5rem;
  }

  .scene--singleplayer .playername {
    font-size: 1.4rem;
  }

  .scene--singleplayer .logo-image {
    width: 70vw;
    margin-top: -20px;
  }

  .buttons {
    gap: 18px;
  }
}
</style>
