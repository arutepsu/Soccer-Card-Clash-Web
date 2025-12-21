<script setup lang="ts">
import NavButtonBar from './NavButtonBar.vue';
import { useRouter } from 'vue-router';
import { useOverlay } from './../../composables/useOverlay';
import { useAppServices } from './../../app/appServices';
import { fileIOApi } from './../../api/fileIoApi';
import PauseDialog from '../dialog/PauseDialog.vue';
import { useGameCommands } from '@/composables/useGameCommands';

const props = defineProps<{
  busy?: boolean;
}>();

const router = useRouter();
const services = useAppServices();
const { show, hide } = useOverlay();

const { undo, redo, getState, busy: cmdBusy } = useGameCommands();

const soundManager = services.soundManager;

function playHover(volume = 0.3) {
  soundManager?.play('hover', { volume });
}

function go(path: string) {
  router.push(path);
}

async function doRestart() {
  console.log('[NavButtonBarContainer] doRestart');
  try {
    await getState();
    go('/playing-field');
  } catch (e) {
    console.error('[NavButtonBarContainer] Restart failed', e);
    alert('Restart failed. Please try again.');
  }
}

async function doSaveGame() {
  try {
    await fileIOApi.quickSave();
    console.log('[NavButtonBarContainer] Save OK');
    soundManager?.play('success', { volume: 0.7 });
    go('/main-menu');
  } catch (error: any) {
    console.error('[NavButtonBarContainer] Save failed', error);
    alert('Failed to save game: ' + (error?.message ?? 'Unknown error'));
  }
}

async function doUndo() {
  try {
    await undo();
  } finally {
    hide();
  }
}

async function doRedo() {
  try {
    await redo();
  } finally {
    hide();
  }
}

function handlePauseAction(action: string) {
  console.log('[NavButtonBarContainer] pause action =', action);

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
    return go('/main-menu');
  }
}

function openPauseDialog() {
  show({
    title: 'Paused',
    message: null,
    content: PauseDialog,
    componentProps: {
      onAction: handlePauseAction,
    },
  });
}

function handlePause() {
  openPauseDialog();
}

function handleGoDefenders() {
  go('/attacker-defenders');
}

function handleGoHand() {
  go('/attacker-hand');
}

function handleHover(payload: { action: string }) {
  console.log('[NavButtonBarContainer] hover', payload.action);
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
