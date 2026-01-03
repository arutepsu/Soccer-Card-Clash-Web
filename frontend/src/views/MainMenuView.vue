<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { createSoundManager, type SoundManager } from '../utils/soundManager';
import { useOverlay } from '../composables/useOverlay';
import GameLogo from '../components/logo/GameLogo.vue';
import MenuCarousel from '../components/carousel/MainMenuCarousel.vue';
import mainBg from '@/assets/images/frames/background1.jpg';
import { useAppServices, setCurrentPlayerId } from '@/app/appServices'
import { authState } from '@/auth/authState'

const router = useRouter();
const { show, hide } = useOverlay();

const sceneRoot = ref<HTMLElement | null>(null);
const carouselRef = ref<InstanceType<typeof MenuCarousel> | null>(null);
const { auth, push, gameContext } = useAppServices()

const soundManager: SoundManager = createSoundManager({
  basePath: '/assets/sounds/',
});

let unlockAudioHandler: ((e: Event) => void) | null = null;

type MainMenuAction =
  | 'online-multiplayer'
  | 'singleplayer'
  | 'multiplayer'
  | 'load'
  | 'about'
  | 'rules'
  | 'logout';

const menuItems = [
  {
    action: 'online-multiplayer' as MainMenuAction,
    title: 'Online Multiplayer',
    description: 'Create or join a session and play against a friend online.',
    buttonLabel: 'Play Online',
  },
  {
    action: 'singleplayer' as MainMenuAction,
    title: 'Singleplayer',
    description: 'Play a strategic match against the AI and master the basics.',
    buttonLabel: 'Start Singleplayer',
  },
  {
    action: 'multiplayer' as MainMenuAction,
    title: 'Multiplayer',
    description: 'Challenge a friend online and clash with your best tactics.',
    buttonLabel: 'Start Multiplayer',
  },
  {
    action: 'load' as MainMenuAction,
    title: 'Load Game',
    description: 'Continue a saved match and finish what you started.',
    buttonLabel: 'Load Save',
  },
  {
    action: 'about' as MainMenuAction,
    title: 'About',
    description: 'Learn more about Soccer Card Clash and how it was made.',
    buttonLabel: 'Read About',
  },
  {
    action: 'rules' as MainMenuAction,
    title: 'Game Information',
    description: 'Check detailed rules, card abilities and scoring.',
    buttonLabel: 'View Rules',
  },
  {
    action: 'logout' as MainMenuAction,
    title: 'Logout',
    description: 'Return to the login screen and switch account.',
    buttonLabel: 'Logout',
  },
];

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

function goSinglePlayer() {
  onButtonClick();
  router.push({ name: 'SinglePlayer' });
}
function goSession() {
  onButtonClick();
  router.push({name: 'SessionView'})
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

async function onLogoutClick() {
  onButtonClick()

  try {
    try { gameContext.stop?.() } catch {}
    try { push.close?.() } catch {}

    await auth.logout()
  } catch (e) {
    console.warn('[logout] error', e)
  } finally {
    authState.setLoggedOut()
    setCurrentPlayerId('')

    await router.replace({ name: 'Login' })
  }
}



function onCommand(payload: { action: MainMenuAction }) {
  switch (payload.action) {
    case 'online-multiplayer':
      onButtonClick();
      goSession();
      break;
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

/** keyboard: arrows rotate carousel, Enter selects current, Esc closes overlay */
function onKeydown(e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      carouselRef.value?.next?.();
      onButtonHover();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      carouselRef.value?.prev?.();
      onButtonHover();
      break;
    case 'Enter':
      e.preventDefault();
      {
        const action = carouselRef.value?.getCurrentAction?.() as
          | MainMenuAction
          | null;
        if (action) {
          onCommand({ action });
        }
      }
      break;
    case 'Escape':
      hide();
      break;
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

  nextTick(() => {
    sceneRoot.value?.focus?.();
  });
});

onUnmounted(() => {
  if (unlockAudioHandler) {
    window.removeEventListener('pointerdown', unlockAudioHandler);
    window.removeEventListener('keydown', unlockAudioHandler);
  }
});

const mainMenuStyle = {
  backgroundImage: `url(${mainBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

</script>

<template>
  <div
    class="scene scene--mainmenu is-active"
    aria-hidden="false"
    ref="sceneRoot"
    tabindex="0"
    @keydown="onKeydown"
    :style="mainMenuStyle"
  >

    <div class="container-fluid h-100">
      <div class="row h-100 align-items-center justify-content-center">
        <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
          <div class="menu-stack">
            <GameLogo />

            <MenuCarousel
              ref="carouselRef"
              :items="menuItems"
              @command="onCommand"
              @hover="onHover"
            />
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
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