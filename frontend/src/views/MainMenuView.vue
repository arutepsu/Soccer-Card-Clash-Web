<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import { useOverlay } from '../composables/useOverlay';
import GameButton from '../components/button/GameButton.vue';
import GameLogo from '../components/logo/GameLogo.vue';
const router = useRouter();
const { show, hide } = useOverlay();

const sceneRoot = ref<HTMLElement | null>(null);
const buttons = ref<HTMLButtonElement[]>([]);

const soundManager: SoundManager = createSoundManager({
  basePath: '/assets/sounds/',
});

let unlockAudioHandler: ((e: Event) => void) | null = null;

function registerButton(el: any) {
  if (!el) return;

  const btn = (el.el ?? el) as HTMLElement | null;
  if (btn instanceof HTMLButtonElement && !buttons.value.includes(btn)) {
    buttons.value.push(btn);
  }
}

function onButtonHover() {
  soundManager.play('hover', { volume: 0.8 });
}

function onButtonClick() {
  soundManager.play('click', { volume: 0.6 });
}

function openAbout() {
  onButtonClick();

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

type MainMenuAction =
  | 'singleplayer'
  | 'multiplayer'
  | 'load'
  | 'about'
  | 'rules'
  | 'logout';

function onCommand(payload: { action: MainMenuAction }) {
  switch (payload.action) {
    case 'singleplayer':
      goSinglePlayer();
      break;
    case 'multiplayer':
      goMultiplayer();
      break;
    case 'load':
      goLoadGame();
      break;
    case 'about':
      openAbout();
      break;
    case 'rules':
      onGameInfoClick();
      break;
    case 'logout':
      onLogoutClick();
      break;
  }
}

function onHover(payload: { action: MainMenuAction; hovering: boolean }) {
  if (payload.hovering) {
    onButtonHover();
  }
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
            <GameLogo />
            <nav class="buttons" aria-label="Main menu">
              <div class="d-grid gap-2">
                <GameButton
                  action="singleplayer"
                  label="Singleplayer"
                  :ref="registerButton"
                  @command="onCommand"
                  @hover="onHover"
                />

                <GameButton
                  action="multiplayer"
                  label="Multiplayer"
                  :ref="registerButton"
                  @command="onCommand"
                  @hover="onHover"
                />

                <GameButton
                  action="load"
                  label="Load Game"
                  :ref="registerButton"
                  @command="onCommand"
                  @hover="onHover"
                />

                <GameButton
                  action="about"
                  label="About"
                  data-open-overlay
                  :ref="registerButton"
                  @command="onCommand"
                  @hover="onHover"
                />

                <GameButton
                  action="rules"
                  label="Game Information"
                  :ref="registerButton"
                  @command="onCommand"
                  @hover="onHover"
                />

                <GameButton
                  action="logout"
                  label="Logout"
                  :ref="registerButton"
                  @command="onCommand"
                  @hover="onHover"
                />
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="info-label">Developed by Arutepsu</div>
  </div>
</template>

<style scoped>

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.scene--mainmenu {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  background-image: url('/assets/images/frames/background1.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  font-family: "Rajdhani", Arial, sans-serif;
  overflow-y: auto;
  overflow-x: hidden;
}
.scene--mainmenu.is-active {
  display: block;
}

.menu-stack {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 0px;
}

.buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-top: 5px;
}

.buttons .d-grid {
  gap: 0px !important;
  margin-top: -20px;
}

.sr-only {
  position: absolute;
  width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

.gbtn {
  margin: -20px 0 !important;
  width: 100% !important;
}

.logo-image {
  max-width: 200px;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
  margin-bottom: 5px; 
}

.info-label {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: clamp(14px, 3vw, 20px);
  color: #39FF14;
  text-shadow: 0 0 6px #39FF14, 0 0 12px rgba(57,255,20,0.6);
  pointer-events: none;
  line-height: 1;
  text-align: center;
  padding: 0 10px;
}


@media (max-width: 576px) {
  .logo-image {
    max-width: 150px;
  }
  
  .gbtn {
    --btn-w: 260px !important;
    --btn-h: 100px !important;
    font-size: 16px !important;
  }
  
  .menu-stack {
    padding: 5px;
  }
}

@media (min-width: 577px) and (max-width: 768px) {
  .logo-image {
    max-width: 240px;
  }
  
  .gbtn {
    --btn-w: 300px !important;
    --btn-h: 130px !important;
  }
}

@media (min-width: 769px) {
  .logo-image {
    max-width: 280px;
  }
}

</style>