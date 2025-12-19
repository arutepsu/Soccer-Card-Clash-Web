<!-- frontend/src/views/PlayingFieldView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { usePlayingField } from '../composables/usePlayingField';
import { useAppServices } from '../app/appServices';
import PlayersBar from '../components/player/PlayersBar.vue';
import NavButtonBarContainer from '../components/button/NavButtonBarContainer.vue';
import PlayersField from '../components/field/PlayersField.vue';
import PlayersHand from '../components/hand/PlayersHand.vue';
import ActionButtonBar from '../components/button/ActionButtonBar.vue';
import { createPlayerAvatarRegistry } from '../utils/playerAvatarRegistry';
import { UIActionScheduler } from '../ui/uiActionScheduler';
import { createComparisonDialogHandler } from '../utils/playingField/comparisonDialogHandler';
import { createComparisonOrchestrator } from '../utils/playingField/comparisonOrchestrator';
import { createSoundManager } from '../utils/soundManager';

import { useOverlay } from '../composables/useOverlay';
import type { WebGameState } from '../types/WebGameState';
import type { GameApi } from '../api/gameApi';
import playingBg from '@/assets/images/frames/background5.jpg';
import { SelectedTarget } from '@/types/AttackerDefenders';
import CinemaMode from '@/components/cinemaMode/CinemaMode.vue';

const {
  gameContext,
  sceneView,
  busy,
  init,
  attackDefender,
  attackGoalkeeper,
  doubleAttack,
} = usePlayingField();

const webState = computed(
  () => gameContext.state.value as WebGameState | null,
);

const displaySceneView = ref(sceneView.value);

const avatarRegistry = createPlayerAvatarRegistry({
  avatarsPath: '/assets/images/players/',
  fileNames: [
    'player1.jpg',
    'player2.jpg',
    'ai.jpg',
    'taka.jpg',
    'defendra.jpg',
    'bitstrom.jpg',
    'meta.jpg',
  ],
});

const selectedTarget = ref<SelectedTarget>(null);

const { show, hide } = useOverlay();

function showInfoAlert(message: string) {
  show({
    title: 'Info',
    message,
    content: null,
  });
}

const { api: appApi } = useAppServices();
const api = appApi as GameApi;

const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
soundManager.preload('attack', 'attack.wav');
soundManager.preload('hover', 'hover.wav');

const lastRoles = {
  attacker: '',
  defender: '',
};

const scheduler = new UIActionScheduler();

let orchestrator: ReturnType<typeof createComparisonOrchestrator> | null = null;

const comparisonHandler = createComparisonDialogHandler({
  contextHolder: {
    get: () => ({
      roles: {
        attacker: lastRoles.attacker,
        defender: lastRoles.defender,
      },
    }),
  },
  onAutoClose: () => {
    orchestrator?.applyBufferedStateAfterOverlay();
  },
  avatarRegistry,
});

orchestrator = createComparisonOrchestrator({
  api,
  scheduler,
  comparisonHandler,
  ActionNames: {
    RegularAttack: 'RegularAttack',
    DoubleAttack: 'DoubleAttack',
    Undo: 'Undo',
    Redo: 'Redo',
    BoostDefender: 'BoostDefender',
    BoostGoalkeeper: 'BoostGoalkeeper',
    RegularSwap: 'RegularSwap',
    ReverseSwap: 'ReverseSwap',
  },
  getRoles: () => lastRoles,
  applyUiFromWeb: (web) => {
    if (web?.roles) {
      lastRoles.attacker = web.roles.attacker || '';
      lastRoles.defender = web.roles.defender || '';
    }
    displaySceneView.value = sceneView.value;
  },
  updateFromServerContext: (_web) => {
  },
  soundManager,
});

const you = computed(() => webState.value?.you ?? null);

const isOnline = computed(() => !!you.value);

const isMyTurn = computed(() => {
  const st = webState.value;
  const me = you.value?.username;
  if (!st?.roles?.attacker || !me) return false;
  return st.roles.attacker === me;
});

const cinemaActive = computed(() => isOnline.value && !isMyTurn.value);

const opponentName = computed(() => {
  const st = webState.value;
  const me = you.value?.username;
  if (!st?.roles || !me) return 'Opponent';
  return st.roles.attacker === me ? st.roles.defender : st.roles.attacker;
});

function requireMyTurn(): boolean {
  if (!isMyTurn.value) {
    showInfoAlert("It's not your turn.");
    return false;
  }
  return true;
}

function handleDefenderSelected(index: number | null) {
  if (index == null) {
    selectedTarget.value = null;
  } else {
    selectedTarget.value = { kind: 'defender', index };
  }
}

function handleGoalkeeperSelected(selected: boolean) {
  selectedTarget.value = selected ? { kind: 'goalkeeper' } : null;
}


async function handleAttackDefender() {
  if (!requireMyTurn()) return;
  const sel = selectedTarget.value;

  if (!sel) {
    showInfoAlert('Pick a defender or the goalkeeper to attack.');
    return;
  }

  if (sel.kind === 'goalkeeper') {
    await handleAttackGoalkeeper();
    return;
  }

  if (sel.kind !== 'defender') {
    showInfoAlert('Pick a defender card to attack.');
    return;
  }

  try {
    orchestrator?.setPendingAction('RegularAttack');
    await attackDefender(sel.index);

    const web = webState.value;
    if (web && orchestrator) {
      orchestrator.afterServerApply(web, {
        action: 'RegularAttack',
        defenderIndex: sel.index,
      });
    }
  } catch (err: any) {
    console.error('[PlayingFieldView] attackDefender error:', err);
    showInfoAlert('Attack failed. Please try again.');
  } finally {
    selectedTarget.value = null;
  }
}



async function handleAttackGoalkeeper() {
  if (!requireMyTurn()) return;
  try {
    orchestrator?.setPendingAction('RegularAttack');
    await attackGoalkeeper();

    const web = webState.value;
    if (web && orchestrator) {
      orchestrator.afterServerApply(web, {
        action: 'RegularAttack',
        defenderIndex: -1,
      });
    }
  } catch (err) {
    console.error('[PlayingFieldView] attackGoalkeeper error:', err);
    showInfoAlert('Goalkeeper attack failed. Please try again.');
  } finally {
    selectedTarget.value = null;
  }
}

async function handleDoubleAttack() {
  if (!requireMyTurn()) return;
  const sel = selectedTarget.value;

  if (!sel || sel.kind !== 'defender') {
    showInfoAlert('Pick a defender card for double attack.');
    return;
  }

  try {
    orchestrator?.setPendingAction('DoubleAttack');
    await doubleAttack(sel.index);

    const web = webState.value;
    if (web && orchestrator) {
      orchestrator.afterServerApply(web, {
        action: 'DoubleAttack',
        defenderIndex: sel.index,
      });
    }
  } catch (err) {
    console.error('[PlayingFieldView] doubleAttack error:', err);
    showInfoAlert('Double attack failed. Please try again.');
  } finally {
    selectedTarget.value = null;
  }
}

function handleInfo() {
  showInfoAlert('Select a defender or the goalkeeper, then choose an attack.');
}

onMounted(async () => {
  await init();
});

watch(
  webState,
  (st) => {
    if (!st || !orchestrator) return;
    orchestrator.handleStreamWeb(st);
  },
  { immediate: true },
);


const playingSceneStyle = {
  backgroundImage: `url(${playingBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

</script>

<template>
  <div
    class="scene scene--playingfield is-active"
    aria-live="polite"
    :style="playingSceneStyle"
  >
    <PlayersBar
      v-if="webState"
      :web="webState"
      :avatarRegistry="avatarRegistry"
    />

    <main class="board" role="main">
      <nav
        id="nav-bar"
        aria-label="Navigation menu"
        data-href-defenders="/attacker-defenders"
        data-href-hand="/attacker-hand"
      >
        <NavButtonBarContainer :busy="busy" />
      </nav>

      <section id="field" aria-label="Defender Field">
        <div class="card-bar-frame" id="field-frame">
          <PlayersField
            :scene="displaySceneView"
            :busy="busy"
            @defender-selected="handleDefenderSelected"
            @goalkeeper-selected="handleGoalkeeperSelected"
          />
        </div>
      </section>

      <aside id="action-bar" aria-label="Action buttons">
        <ActionButtonBar
          :busy="busy || cinemaActive"
          @attack-defender="handleAttackDefender"
          @attack-goalkeeper="handleAttackGoalkeeper"
          @double-attack="handleDoubleAttack"
          @info="handleInfo"
        />
      </aside>
    </main>

    <footer id="hand-row" aria-label="Attacker Hand and Avatar">
      <section id="hand" aria-label="Attacker Hand">
        <PlayersHand :scene="displaySceneView" :busy="busy" />
      </section>

      <section id="attacker-avatar-box" aria-label="Current Attacker">
      </section>
    </footer>
  </div>

  <CinemaMode
    :active="cinemaActive"
    message="Opponent’s turn"
    :subMessage="`Waiting for ${opponentName}…`"
  />

</template>

<style scoped>

.scene--playingfield {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  font-family: "Rajdhani", Arial, sans-serif;
  color: #e8eef5;
  overflow: hidden;

  min-height: 100vh;
  min-height: 100dvh;
}
.action-button-bar {
  position: relative !important;
  z-index: 9999 !important;
}

.board {
  display: grid;
  grid-template-columns: 180px 1fr 180px;
  align-items: center;
  justify-items: center;
  gap: clamp(6px, 1vw, 12px);
  padding: clamp(4px, 2vw, 10px);
}
#nav-bar {
  display: flex;
  flex-direction: column;
  justify-self: end;
  align-items: flex-end;
  gap: 9px;
  transform: translateX(450px);
}

#action-bar {
  display: flex;
  flex-direction: column;
  justify-self: start;
  align-items: flex-start;
  gap: 9px;
  transform: translateX(-450px);
}


.input-blocker {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(2px);
  display: none;
  z-index: 1000;
}
.input-blocker.is-active {
  display: block;
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 1024px) {
  .board {
    grid-template-columns: 150px 1fr 150px;
    gap: 8px;
  }
}

@media (max-width: 1200px) {
  .board {
    grid-template-columns: 140px 1fr 140px;
    gap: 8px;
  }

  #nav-bar,
  #action-bar {
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .scene--playingfield {
    grid-template-rows: auto 1fr auto;
    padding: 0;
  }

  .board {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 8px;
    padding: clamp(4px, 1vw, 8px);
  }

  #nav-bar {
    order: 1;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    justify-self: center;
    align-items: center;
    gap: 6px;
  }

  #field {
    order: 2;
    width: 100%;
  }

  #action-bar {
    order: 3;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    justify-self: center;
    align-items: center;
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .scene--playingfield {
    grid-template-rows: auto 1fr auto;
  }

  .board {
    gap: 6px;
    padding: 4px;
  }

  #nav-bar,
  #action-bar {
    gap: 3px;
  }
}

@media (max-width: 360px) {
  #nav-bar,
  #action-bar {
    gap: 2px;
  }
}

@media (max-height: 600px) and (orientation: landscape) {
  .scene--playingfield {
    grid-template-rows: auto 1fr;
    font-size: 90%;
  }

  .board {
    grid-template-columns: 120px 1fr 120px;
    grid-template-rows: 1fr;
    gap: 6px;
    padding: 4px;
    overflow: hidden;
  }

  #nav-bar {
    order: 1;
    flex-direction: column;
    justify-self: start;
    align-self: center;
    transform: translateX(0);
  }

  @keyframes cameraZoom {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
.scene--playingfield.goal {
  animation: cameraZoom 0.6s ease;
}


  #field {
    order: 2;
    align-self: center;
  }

  #action-bar {
    order: 3;
    flex-direction: column;
    justify-self: end;
    align-self: center;
    transform: translateX(0);
  }
  #nav-bar,
  #action-bar { gap: 4px; }

  #hand-row {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: auto;
    padding: 4px 0;
    z-index: 100;
  }
}



@media (max-height: 500px) and (orientation: landscape) {
  .board {
    grid-template-columns: 100px 1fr 100px;
    gap: 4px;
    padding: 2px;
  }

  #nav-bar,
  #action-bar {
    gap: 3px;
  }
  .scene--playingfield { font-size: 85%; }
}

@media (max-height: 400px) and (orientation: landscape) {
  .scene--playingfield { font-size: 80%; }
  #nav-bar,
  #action-bar { gap: 2px; }

}

@media (orientation: portrait) {
  .rotate-notice {
    display: flex !important;
    position: fixed;
    z-index: 2000;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85);
    color: #fff;
    align-items: center;
    justify-content: center;
    font-size: 1.5em;
    text-align: center;
  }
}
@media (orientation: landscape) {
  .rotate-notice {
    display: none !important;
  }
}

.rotate-notice {
  background: rgb(0, 0, 0);
}

</style>