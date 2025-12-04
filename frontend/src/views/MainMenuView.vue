<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import { useOverlay } from '../composables/useOverlay';

const router = useRouter();
const { show, hide } = useOverlay();

const sceneRoot = ref<HTMLElement | null>(null);
const buttons = ref<HTMLButtonElement[]>([]);

const soundManager: SoundManager = createSoundManager({
  basePath: '/assets/sounds/',
});

let unlockAudioHandler: ((e: Event) => void) | null = null;

function registerButton(el: HTMLButtonElement | null) {
  if (el && !buttons.value.includes(el)) buttons.value.push(el);
}

function onButtonHover() {
  soundManager.play('hover', { volume: 0.8 });
}

function onButtonClick() {
  soundManager.play('click', { volume: 0.6 });
}

function openAbout() {
  onButtonClick();

  // Simple text-based About overlay via store
  show({
    title: 'About the Game',
    message:
      'Soccer Card Clash\n\n' +
      'A strategic football card game where attackers and defenders clash ' +
      'using unique cards, boosts and tactics. Select single- or multiplayer, ' +
      'swap and boost cards, and outplay your opponent!',
    content: null,
  });
}

function moveFocus(delta: number): void {
  const focusables = buttons.value.filter((b) => !b.disabled);
  if (!focusables.length) return;

  const active = document.activeElement as HTMLButtonElement | null;
  const currentIdx = active ? focusables.indexOf(active) : -1;
  const idx = Math.max(0, currentIdx);
  const next = (idx + delta + focusables.length) % focusables.length;
  focusables[next].focus();
}

function onKeydown(e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      e.preventDefault();
      moveFocus(+1);
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      e.preventDefault();
      moveFocus(-1);
      break;
    case 'Escape':
      hide();
      break;
  }
}

function goSinglePlayer() {
  onButtonClick();
  router.push({ name: 'SinglePlayer' });
}

function goMultiplayer() {
  onButtonClick();
  router.push({ name: 'Multiplayer' });
}

function goLoadGame() {
  onButtonClick();
  router.push({ name: 'LoadGame' });
}

function onGameInfoClick() {
  onButtonClick();
  router.push({ name: 'Rules' });
}

function onLogoutClick() {
  onButtonClick();
  router.push({ name: 'Login' });
}

onMounted(() => {
  soundManager.preload('hover', 'hover.wav');
  soundManager.preload('click', 'attack.wav');

  unlockAudioHandler = () => {
    soundManager.unlock();
    window.removeEventListener('pointerdown', unlockAudioHandler!);
    window.removeEventListener('keydown', unlockAudioHandler!);
    unlockAudioHandler = null;
  };

  window.addEventListener('pointerdown', unlockAudioHandler);
  window.addEventListener('keydown', unlockAudioHandler);

  nextTick(() => buttons.value[0]?.focus?.());
});

onUnmounted(() => {
  if (unlockAudioHandler) {
    window.removeEventListener('pointerdown', unlockAudioHandler);
    window.removeEventListener('keydown', unlockAudioHandler);
  }
  buttons.value = [];
});
</script>

<template>
  <div
    class="scene scene--mainmenu is-active"
    aria-hidden="false"
    ref="sceneRoot"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div class="container-fluid h-100">
      <div class="row h-100 align-items-center justify-content-center">
        <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
          <div class="menu-stack">
            <div class="text-center mb-3">
              <img
                class="logo-image img-fluid"
                src="/assets/images/logo/logo0.5k.png"
                alt="Soccer Card Clash Logo"
              />
            </div>

            <nav class="buttons" aria-label="Main menu">
              <div class="d-grid gap-2">
                <button
                  class="gbtn"
                  type="button"
                  :ref="registerButton"
                  @mouseenter="onButtonHover"
                  @click="goSinglePlayer"
                >
                  Singleplayer
                </button>

                <button
                  class="gbtn"
                  type="button"
                  :ref="registerButton"
                  @mouseenter="onButtonHover"
                  @click="goMultiplayer"
                >
                  Multiplayer
                </button>

                <button
                  class="gbtn"
                  type="button"
                  :ref="registerButton"
                  @mouseenter="onButtonHover"
                  @click="goLoadGame"
                >
                  Load Game
                </button>

                <button
                  class="gbtn"
                  type="button"
                   :ref="registerButton"
                  data-open-overlay
                  @mouseenter="onButtonHover"
                  @click="openAbout"
                >
                  About
                </button>

                <button
                  class="gbtn"
                  type="button"
                  :ref="registerButton"
                  @mouseenter="onButtonHover"
                  @click="onGameInfoClick"
                >
                  Game Information
                </button>

                <button
                  class="gbtn"
                  type="button"
                  :ref="registerButton"
                  @mouseenter="onButtonHover"
                  @click="onLogoutClick"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="info-label">Developed by Arutepsu</div>
  </div>
</template>