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

async function leaveOnlineSessionIfNeeded() {
  const sid = (route.query.sid as string | undefined) ?? null;
  if (!sid) return;
  if (services.gameContext.mode.value !== 'online') return;

  try {
    await services.sessions.leaveSession(sid);
  } catch (e) {
    console.warn('[NavButtonBarContainer] leaveSession failed', e);
  }
}

async function ensureContextFromRoute() {
  const mode = (route.query.mode as string | undefined) ?? null;
  const sid = (route.query.sid as string | undefined) ?? null;

  if (!mode) return;

  if (services.gameContext.mode.value !== mode) {
    await services.gameContext.start(mode as any, sid);
    return;
  }

  if (mode === 'online' && sid && services.gameContext.sessionId.value !== sid) {
    await services.gameContext.startOnline(sid);
  }
}

async function doRestart() {
  try {
    await ensureContextFromRoute();
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

async function handlePauseAction(action: string) {
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
    await leaveOnlineSessionIfNeeded();
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

async function handleGoDefenders() {
  try {
    await ensureContextFromRoute();
    goName('AttackerDefenders');
  } catch (e) {
    console.error('[NavButtonBarContainer] open defenders failed', e);
    alert('Failed to open defenders view.');
  }
}

async function handleGoHand() {
  try {
    await ensureContextFromRoute();
    goName('AttackerHand');
  } catch (e) {
    console.error('[NavButtonBarContainer] open hand failed', e);
    alert('Failed to open hand view.');
  }
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
