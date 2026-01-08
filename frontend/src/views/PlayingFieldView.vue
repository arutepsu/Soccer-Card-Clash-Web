<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { usePlayingField } from '../composables/usePlayingField';
import { usePlayingFieldMode } from '@/composables/usePlayingFieldMode';
import { useAppServices } from '../app/appServices';
import { useOverlay } from '../composables/useOverlay';
import SessionEndedDialog from '@/components/dialog/SessionEndedDialog.vue';
import PlayersBar from '../components/player/PlayersBar.vue';
import NavButtonBarContainer from '../components/button/NavButtonBarContainer.vue';
import PlayersField from '../components/field/PlayersField.vue';
import PlayersHand from '../components/hand/PlayersHand.vue';
import ActionButtonBar from '../components/button/ActionButtonBar.vue';
import CinemaMode from '@/components/cinemaMode/CinemaMode.vue';

import type { WebGameState } from '../types/WebGameState';
import { SelectedTarget } from '@/types/AttackerDefenders';

import { createPlayerAvatarRegistry } from '../utils/playerAvatarRegistry';
import { UIActionScheduler } from '../ui/uiActionScheduler';
import { createComparisonDialogHandler } from '../utils/playingField/comparisonDialogHandler';
import { createComparisonOrchestrator } from '../utils/playingField/comparisonOrchestrator';
import playingBg from '@/assets/images/frames/background5.jpg';
import { SceneView } from '@/utils/playingField/sceneMapping';
import {
  feedComparisonMetaToHandler,
  pendingActionFromKind,
  type ComparisonMeta,
} from '@/utils/playingField/comparisonMetaAdapter';

const {
  gameContext,
  toSceneView,
  busy,
  init,
  attackDefender,
  attackGoalkeeper,
  doubleAttack,
} = usePlayingField();

const webState = computed(() => gameContext.state.value as WebGameState | null);

const displayWebState = ref<WebGameState | null>(null);
const displaySceneView = ref<SceneView | null>(null);

function applyDisplayFromWeb(web: WebGameState | null) {
  displayWebState.value = web;
  displaySceneView.value = toSceneView(web);
}

watch(
  webState,
  (st) => {
    if (displayWebState.value == null && st) applyDisplayFromWeb(st);
  },
  { immediate: true },
);

const avatarRegistry = createPlayerAvatarRegistry({
  avatarsPath: '/assets/images/players/',
  fileNames: ['player1.jpg', 'player2.jpg', 'ai.jpg', 'taka.jpg', 'defendra.jpg', 'bitstrom.jpg', 'meta.jpg'],
});

const selectedTarget = ref<SelectedTarget>(null);

const { show, hide } = useOverlay();
function showInfoAlert(message: string) {
  show({ title: 'Info', message, content: null });
}

const services = useAppServices();
const router = useRouter();
const route = useRoute();
const { soundManager } = useAppServices()

const mode = usePlayingFieldMode(computed(() => displayWebState.value), showInfoAlert, {
  mode: computed(() => services.gameContext.mode.value),
  localIsVsAI: computed(() => services.gameContext.localIsVsAI.value),
  localHumanName: computed(() => services.gameContext.localHumanName.value),
});

const sessionEnded = ref(false);
const cinemaActive = computed(() => !sessionEnded.value && mode.cinemaActive.value);
const opponentName = mode.opponentName;

const api = computed(() => {
  const m = services.gameContext.mode.value;
  if (!m) return null;

  if (m === 'online') return services.game.forMode('online');

  return services.game.forMode('local', services.gameContext.localKind.value);
});

const scheduler = new UIActionScheduler();

const orchestrator = ref<ReturnType<typeof createComparisonOrchestrator> | null>(null);

const rolesNow = computed(() => ({
  attacker: displayWebState.value?.roles?.attacker ?? '',
  defender: displayWebState.value?.roles?.defender ?? '',
}));

const comparisonHandler = createComparisonDialogHandler({
  contextHolder: {
    get: () => ({ roles: rolesNow.value }),
  },
  onAutoClose: () => {
    orchestrator.value?.applyBufferedStateAfterOverlay();
  },
  avatarRegistry,
});

function makeOrchestrator(a: any) {
  return createComparisonOrchestrator({
    api: a,
    getSid: () =>
      services.gameContext.mode.value === 'online'
        ? services.gameContext.sessionId.value
        : null,
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
    getRoles: () => rolesNow.value,
    applyUiFromWeb: (web) => {
      applyDisplayFromWeb((web ?? null) as WebGameState | null);
    },
    updateFromServerContext: (_web) => {},
    soundManager,
  });
}
watch(
  api,
  (a) => {
    orchestrator.value = a ? makeOrchestrator(a) : null;
  },
  { immediate: true },
);

watch(
  webState,
  (st) => {
    if (!st) return
    if (!displayWebState.value) applyDisplayFromWeb(st)

    const orch = orchestrator.value
    if (!orch) {
      applyDisplayFromWeb(st)
      return
    }

    const metaAny = services.gameContext.lastMeta.value as any

    if (metaAny?.action === 'Comparison') {
      const cmp = metaAny as ComparisonMeta
      feedComparisonMetaToHandler(comparisonHandler, cmp)

      const actionType = pendingActionFromKind(cmp.payload?.kind)
      const defenderIndex = Number.isInteger(cmp.payload?.defenderIndex)
        ? (cmp.payload!.defenderIndex as number)
        : -1

      orch.setPendingAction(actionType, { action: actionType, defenderIndex })
      orch.afterServerApply(st, { action: actionType, defenderIndex } as any)
      orch.handleStreamWeb(st)

      services.gameContext.lastMeta.value = null
      return
    }

    if (metaAny?.action === 'SessionEnded') {
      sessionEnded.value = true
      hide()
      show({
        title: 'Session Ended',
        message: null,
        content: SessionEndedDialog,
        componentProps: {
          leftPlayerName: metaAny.leftPlayerName,
          onAction: () => exitToMainMenu(),
        },
      })
      services.gameContext.lastMeta.value = null
      return
    }

    orch.setPendingAction(null)
    orch.handleStreamWeb(st)
  },
  { immediate: true },
)

function handleDefenderSelected(index: number | null) {
  selectedTarget.value = index == null ? null : { kind: 'defender', index };
}

function handleGoalkeeperSelected(selected: boolean) {
  selectedTarget.value = selected ? { kind: 'goalkeeper' } : null;
}

async function handleAttackDefender() {
  if (!mode.requireMyTurn()) return;

  const sel = selectedTarget.value;
  if (!sel) return showInfoAlert('Pick a defender or the goalkeeper to attack.');
  if (sel.kind === 'goalkeeper') return handleAttackGoalkeeper();

  try {

    await attackDefender(sel.index);

  } catch (err) {
    console.error('[PlayingFieldView] attackDefender error:', err);
    showInfoAlert('Attack failed. Please try again.');

  } finally {
    selectedTarget.value = null;
  }
}


async function handleAttackGoalkeeper() {
  if (!mode.requireMyTurn()) return;

  try {

    await attackGoalkeeper();
  } catch (err) {
    console.error('[PlayingFieldView] attackGoalkeeper error:', err);
    showInfoAlert('Goalkeeper attack failed. Please try again.');

  } finally {
    selectedTarget.value = null;
  }
}

async function handleDoubleAttack() {
  if (!mode.requireMyTurn()) return;

  const sel = selectedTarget.value;
  if (!sel || sel.kind !== 'defender') return showInfoAlert('Pick a defender card for double attack.');

  try {

    await doubleAttack(sel.index);
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

function beaconLeaveIfOnline() {
  const sid = (route.query.sid as string | undefined) ?? null;
  if (!sid) return;
  if (services.gameContext.mode.value !== 'online') return;

  const url = `/api/sessions/${encodeURIComponent(sid)}/leave`;
  try {
    navigator.sendBeacon(url, new Blob([JSON.stringify({})], { type: 'application/json' }));
  } catch {}
}

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', beaconLeaveIfOnline);
});

function exitToMainMenu() {
  hide();
  services.gameContext.clear();
  router.push({ name: 'MainMenu' });
}

async function bootFromRoute(): Promise<void> {
  const qMode = String(route.query.mode ?? '').trim();
  const qSid = String(route.query.sid ?? '').trim();
  const qKind = String(route.query.kind ?? '').trim();

  const modeToUse = (qMode === 'online' ? 'online' : 'local') as 'online' | 'local';

  if (modeToUse === 'online' && !services.net.isOnline.value) {
    await services.gameContext.startLocal('practice');
    return;
  }

  if (modeToUse === 'online') {
    if (!qSid) {
      services.gameContext.clear();
      await router.push({ name: 'MainMenu' });
      return;
    }
    await services.gameContext.startOnline(qSid);
    return;
  }

  const kindToUse = (qKind === 'practice' ? 'practice' : 'pvp') as 'practice' | 'pvp';
  await services.gameContext.startLocal(kindToUse);
}

onMounted(async () => {
  window.addEventListener('pagehide', beaconLeaveIfOnline);

  await bootFromRoute();

  const m = services.gameContext.mode.value;
  if (m === 'local') {
    const kind = services.gameContext.localKind.value;
    const curKind = String(route.query.kind ?? '').trim();
    const curMode = String(route.query.mode ?? '').trim();

    if (curMode !== 'local' || curKind !== kind) {
      router.replace({ name: 'PlayingField', query: { mode: 'local', kind } });
    }
  }

  await init();
});

const playingSceneStyle = {
  backgroundImage: `url(${playingBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};
</script>

<template>
  <div class="scene-root">
    <div
      class="scene scene--playingfield is-active"
      aria-live="polite"
      :style="playingSceneStyle"
    >
      <PlayersBar
        v-if="displayWebState"
        :web="displayWebState"
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

        <section id="attacker-avatar-box" aria-label="Current Attacker"></section>
      </footer>
    </div>

    <CinemaMode
      v-if="$route.name === 'PlayingField'"
      :active="cinemaActive"
      message="Opponent’s turn"
      :subMessage="`Waiting for ${opponentName}…`"
    />
  </div>
</template>

<style scoped>
.scene-root {
  position: fixed;
  inset: 0;
}

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