<!-- frontend/src/views/SinglePlayerView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import { useOverlay } from '../composables/useOverlay';
import GameButton from '../components/GameButton.vue';

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
</script>

<template>
  <div class="scene scene--singleplayer is-active" aria-hidden="false">
    <img
      class="logo-image"
      src="/assets/images/logo/logo0.5k.png"
      alt="Soccer Card Clash Logo"
    />

    <div class="titles">
      <h1 class="title">Create Players</h1>
      <p class="subtitle">Enter Player Names</p>
    </div>

    <input
      class="inputplayer"
      type="text"
      id="p1name"
      name="player1"
      placeholder="Player 1"
      v-model="playerName"
      :disabled="busy"
      autofocus
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
