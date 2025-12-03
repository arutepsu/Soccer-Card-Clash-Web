<!-- frontend/src/views/LoadGameView.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fileIOApi } from '../api/fileIoApi';
import { createSoundManager, type SoundManager } from '../utils/soundManager';

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

onMounted(() => {
  fetchSavedGames();
});
</script>

<template>
  <div class="scene scene--loadgame">
    <h1 class="header">Select a Saved Game</h1>

    <div class="loadgame-messages" aria-live="assertive">
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
      <button
        class="gbtn btn btn-warning"
        type="button"
        @mouseenter="playHover"
        @click="onBackClick"
      >
        Back
      </button>

      <button
        class="gbtn btn load-game-btn"
        type="button"
        :disabled="loadingGame || !selectedGameId"
        :class="{ disabled: loadingGame || !selectedGameId }"
        @mouseenter="playHover"
        @click="onLoadClick"
      >
        {{ loadingGame ? 'Loading...' : 'Load' }}
      </button>
    </div>
  </div>
</template>
