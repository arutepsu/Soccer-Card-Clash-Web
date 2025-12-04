<!-- frontend/src/views/MultiplayerView.vue -->

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import { setPlayers } from '../utils/playerSideRegistry';
import { useOverlay } from '../composables/useOverlay';
import { useGameContext } from '../composables/useGameContext';

const router = useRouter();
const game = useGameContext();
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

  // optional auto-hide
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
    await game.restart(player1.value, player2.value);

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
</script>

<template>
  <div class="scene scene--create-multiplayer is-active" aria-hidden="false">
    <div class="panel create-player-panel">
      <div class="logo">
        <img
          class="logo-image"
          src="/assets/images/logo/logo0.5k.png"
          alt="Soccer Card Clash Logo"
        />
      </div>

      <div class="titles">
        <h1 class="title">Create Players</h1>
        <p class="subtitle">Enter Player Names</p>
      </div>

      <form class="create-player-form" @submit.prevent="onSubmit">
        <div class="inputs">
          <input
            class="player-text-input"
            type="text"
            name="player1"
            placeholder="Player 1"
            v-model="player1"
            :disabled="busy"
            autofocus
          />

          <input
            class="player-text-input"
            type="text"
            name="player2"
            placeholder="Player 2"
            v-model="player2"
            :disabled="busy"
          />
        </div>

        <div class="buttons">
          <button
            class="gbtn"
            type="submit"
            :disabled="busy"
            :class="{ 'is-busy': busy }"
            @mouseenter="onButtonHover"
          >
            Start
          </button>

          <button
            class="gbtn gbtn--secondary"
            type="button"
            @mouseenter="onButtonHover"
            @click="goBack"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
