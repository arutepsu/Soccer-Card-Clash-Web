<script setup lang="ts">
import NavButtonBar from './NavButtonBar.vue';
import { useRoute, useRouter } from 'vue-router';
import { useOverlay } from './../../composables/useOverlay';
import { useAppServices } from './../../app/appServices';
import { fileIOApi } from './../../api/fileIoApi';
import PauseDialog from '../dialog/PauseDialog.vue';
import { useGameCommands } from '@/composables/useGameCommands';

const props = defineProps<{ busy?: boolean }>();

const router = useRouter();
const route = useRoute();
const services = useAppServices();
const { show, hide } = useOverlay();

const { undo, redo, getState, busy: cmdBusy } = useGameCommands();
const soundManager = services.soundManager;

function playHover(volume = 0.3) {
  soundManager?.play('hover', { volume });
}

function goName(name: string) {
  router.push({ name, query: route.query });
}

function goMainMenu() {
  router.push({ name: 'MainMenu' });
}

async function doRestart() {
  try {
    await getState();
    goName('PlayingField');
  } catch (e) {
    console.error('[NavButtonBarContainer] Restart failed', e);
    alert('Restart failed. Please try again.');
  }
}

async function doSaveGame() {
  try {
    await fileIOApi.quickSave();
    soundManager?.play('success', { volume: 0.7 });

    // Decide what you want after save:
    // - If you want to KEEP the game and allow Back -> stay in gameplay:
    //   goName('PlayingField');
    // - If you want to EXIT (recommended)
    services.gameContext.clear(); 
    goMainMenu();
  } catch (error: any) {
    console.error('[NavButtonBarContainer] Save failed', error);
    alert('Failed to save game: ' + (error?.message ?? 'Unknown error'));
  }
}

async function doUndo() {
  try { await undo(); } finally { hide(); }
}

async function doRedo() {
  try { await redo(); } finally { hide(); }
}

function handlePauseAction(action: string) {
  if (action === 'resume') return hide();
  if (action === 'undo') return void doUndo();
  if (action === 'redo') return void doRedo();

  if (action === 'save') {
    hide();
    return void doSaveGame();
  }

  if (action === 'restart') {
    hide();
    return void doRestart();
  }

  if (action === 'mainmenu') {
    hide();
    services.gameContext.clear();
    return goMainMenu();
  }
}

function openPauseDialog() {
  show({
    title: 'Paused',
    message: null,
    content: PauseDialog,
    componentProps: { onAction: handlePauseAction },
  });
}

function handlePause() {
  openPauseDialog();
}

function handleGoDefenders() {
  goName('AttackerDefenders');
}

function handleGoHand() {
  goName('AttackerHand');
}

function handleHover(payload: { action: string }) {
  playHover(0.3);
}
</script>

<template>
  <NavButtonBar
    :busy="busy || cmdBusy"
    @pause="handlePause"
    @go-defenders="handleGoDefenders"
    @go-hand="handleGoHand"
    @hover="handleHover"
  />
</template>
