<!-- frontend/src/views/LoadGameView.vue -->
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { fileIOApi } from '../api/fileIoApi';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import GameButton from '../components/button/GameButton.vue';
import loadBg from '@/assets/images/frames/background4.jpg';

const router = useRouter();

const savedGames = ref<string[]>([]);
const selectedGameId = ref<string | null>(null);

const loadingList = ref(false);
const loadingGame = ref(false);

type MessageType = 'info' | 'success' | 'error';
const messageText = ref<string | null>(null);
const messageType = ref<MessageType>('info');
let messageTimeout: number | null = null;

const soundManager: SoundManager = createSoundManager({
  basePath: '/assets/sounds/',
});

soundManager.preload('hover', 'hover.wav');
soundManager.preload('click', 'attack.wav');

function playHover() {
  soundManager.play('hover', { volume: 0.3 });
}

function playClick() {
  soundManager.play('click', { volume: 0.6 });
}

function announce(msg: string, type: MessageType = 'info') {
  messageText.value = msg;
  messageType.value = type;

  if (messageTimeout !== null) {
    window.clearTimeout(messageTimeout);
  }
  messageTimeout = window.setTimeout(() => {
    messageText.value = null;
  }, 4000);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

async function fetchSavedGames() {
  loadingList.value = true;
  try {
    const files = await fileIOApi.listSavedGames();
    savedGames.value = files;
    selectedGameId.value = null;
    announce(
      `Found ${files.length} saved game${files.length !== 1 ? 's' : ''}`,
      'info',
    );
  } catch (err) {
    console.error('Could not fetch saved games:', err);
    savedGames.value = [];
    announce('Could not fetch saved games.', 'error');
  } finally {
    loadingList.value = false;
  }
}

function isSelected(fileName: string): boolean {
  return selectedGameId.value === fileName;
}

function selectGame(fileName: string) {
  if (loadingGame.value) return;
  playClick();
  selectedGameId.value = fileName;
  announce(`Selected: ${fileName}`, 'info');
}

async function onLoadClick() {
  if (!selectedGameId.value) {
    announce('Please select a game to load.', 'error');
    return;
  }

  if (loadingGame.value) {
    return;
  }

  playClick();
  loadingGame.value = true;

  const gameId = selectedGameId.value;
  try {
    const sessionId = await fileIOApi.resolveSessionId();
    const response = await fileIOApi.loadGame(gameId, sessionId);

    announce(`Successfully loaded: ${gameId}`, 'success');

    if (response.gameState) {
      console.log('[LoadGameView] loaded gameState preview:', response.gameState);
    }

    await router.push({ name: 'PlayingField' });
  } catch (err: any) {
    console.error('Error loading game:', err);
    const msg = err?.message || 'Failed to load the selected game.';
    announce(msg, 'error');
    loadingGame.value = false;
  }
}

function onBackClick() {
  if (loadingGame.value) return;
  playClick();
  router.push({ name: 'MainMenu' });
}

type LoadAction = 'back' | 'load';

function onCommand(payload: { action: LoadAction }) {
  switch (payload.action) {
    case 'back':
      onBackClick();
      break;
    case 'load':
      onLoadClick();
      break;
  }
}

function onHover(payload: { action: LoadAction; hovering: boolean }) {
  if (payload.hovering) {
    playHover();
  }
}

onMounted(() => {
  fetchSavedGames();
});

const sceneStyle = computed(() => ({
  backgroundImage: `url(${loadBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}));

</script>

<template>
  <div class="scene scene--loadgame">
    <h1 class="header">Select a Saved Game</h1>

<div class="scene scene--loadgame" :style="sceneStyle">
      <div
        v-if="messageText"
        class="msg"
        :class="`msg--${messageType}`"
      >
        {{ messageText }}
      </div>
    </div>

    <div class="container" aria-live="polite">
      <div v-if="loadingList" class="empty-note">
        Loading saved games...
      </div>

      <div v-else-if="!savedGames.length" class="empty-note">
        No saved games found.
      </div>

      <div v-else class="save-list">
        <div
          v-for="fileName in savedGames"
          :key="fileName"
          class="save-card"
          :class="{ selected: isSelected(fileName) }"
          @mouseenter="playHover"
          @click="selectGame(fileName)"
        >
          <div class="save-card__header">
            <strong class="save-title">{{ fileName }}</strong>
          </div>
          <div class="save-card__meta">
          </div>
        </div>
      </div>
    </div>

    <div class="buttons">
      <GameButton
        action="back"
        label="Back"
        class="btn btn btn-warning"
        @command="onCommand"
        @hover="onHover"
      />

      <GameButton
        action="load"
        class="btn load-game-btn"
        :busy="loadingGame"
        :disabled="loadingGame || !selectedGameId"
        :class="{ disabled: loadingGame || !selectedGameId }"
        @command="onCommand"
        @hover="onHover"
      >
        {{ loadingGame ? 'Loading...' : 'Load' }}
      </GameButton>
    </div>
  </div>
</template>

<style scoped>
  html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: "Rajdhani", Arial, sans-serif;
}

.scene--loadgame {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.scene--loadgame .header {
  color: #f3ca04;
  font-size: 4rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(243, 202, 4, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6);
  margin-bottom: 1rem;
  text-align: center;
}

.scene--loadgame .container {
  background-color: rgba(154, 108, 178, 1);
  color: #fff;
  width: 80vw;
  height: 50vh;
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 1rem;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.scene--loadgame .buttons {
  display: flex;
  justify-content: center;
}

.gbtn {
  background-color: #f3ca04;
  color: #000;
  padding: 0.8rem 2rem;
  border-radius: 1rem;
  text-decoration: none;
  font-weight: bold;
  transition: transform 0.2s, background-color 0.2s;
}

.gbtn:hover {
  background-color: #ffea6f;
  transform: scale(1.05);
}

.logo-image {
  max-width: 280px;
  width: 50vw;
  height: auto;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
  margin-bottom: 4px;
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
  .scene--loadgame .header {
    font-size: 2.5rem;
  }
  .scene--loadgame .container {
    width: 90vw;
    height: 40vh;
  }
}
</style>