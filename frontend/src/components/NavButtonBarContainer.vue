<!-- frontend/src/components/NavButtonBarContainer.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router';
import NavButtonBar from './NavButtonBar.vue';
import { useOverlay } from '../composables/useOverlay';
import { useAppServices } from '../app/appServices';
import { fileIOApi } from '../api/fileIoApi';
import PauseDialog from './PauseDialog.vue';

const props = defineProps<{
  busy?: boolean;
}>();

const router = useRouter();
const { api, soundManager } = useAppServices();
const { show, hide } = useOverlay();

function playHover(volume = 0.3) {
  soundManager?.play('hover', { volume });
}

function go(path: string) {
  router.push(path);
}

// ------------------ Pause Dialog Logic ------------------

async function doRestart() {
  console.log('[NavButtonBarContainer] doRestart');

  try {
    await api.restart();
    go('/playing-field');
  } catch (e) {
    console.error('[NavButtonBarContainer] Restart failed', e);
    alert('Restart failed. Please try again.');
  }
}

async function doSaveGame() {
  const btnLabel = 'Save Game';
  try {
    await fileIOApi.quickSave();
    console.log('[NavButtonBarContainer] Save OK');
    soundManager?.play('success', { volume: 0.7 });
    // After save, go to main menu
    go('/main-menu');
  } catch (error: any) {
    console.error('[NavButtonBarContainer] Save failed', error);
    alert('Failed to save game: ' + (error?.message ?? 'Unknown error'));
  }
}

function handlePauseAction(action: string) {
  console.log('[NavButtonBarContainer] pause action =', action);

  if (action === 'resume') {
    hide();
    return;
  }

  if (action === 'undo') {
    api.undo?.();
    hide();
    return;
  }

  if (action === 'redo') {
    api.redo?.();
    hide();
    return;
  }

  if (action === 'save') {
    hide();
    void doSaveGame();
    return;
  }

  if (action === 'restart') {
    hide();
    void doRestart();
    return;
  }

  if (action === 'mainmenu') {
    hide();
    go('/main-menu');
    return;
  }
}

function openPauseDialog() {
  console.log('[NavButtonBarContainer] openPauseDialog (store-based overlay)');

  show({
    title: 'Paused',
    message: null,
    content: PauseDialog,
    props: {
      onAction: handlePauseAction,
    },
  });
}

// ------------------ NavButtonBar events ------------------

function handlePause() {
  console.log('[NavButtonBarContainer] handlePause (pause clicked)');
  openPauseDialog();
}

function handleGoDefenders() {
  console.log('[NavButtonBarContainer] go-defenders');
  go('/attacker-defenders');
}

function handleGoHand() {
  console.log('[NavButtonBarContainer] go-hand');
  go('/attacker-hand');
}

function handleHover(payload: { action: string }) {
  console.log('[NavButtonBarContainer] hover', payload.action);
  playHover(0.3);
}
</script>

<template>
  <NavButtonBar
    :busy="busy"
    @pause="handlePause"
    @go-defenders="handleGoDefenders"
    @go-hand="handleGoHand"
    @hover="handleHover"
  />
</template>
