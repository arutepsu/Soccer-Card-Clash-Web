<!-- frontend/src/views/PlayingFieldView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { usePlayingField } from '../composables/usePlayingField';
import PlayersBar from '../components/PlayersBar.vue';
import NavButtonBar from '../components/NavButtonBar.vue';
import PlayersField from '../components/PlayersField.vue';
import PlayersHand from '../components/PlayersHand.vue';
import ActionButtonBar from '../components/ActionButtonBar.vue';
import { createPlayerAvatarRegistry } from '../utils/playerAvatarRegistry';
import { useOverlay } from '../composables/useOverlay';
import { createGameAlert } from '../ui/gameAlertFactory';
import { WebGameState } from '../types/WebGameState';
import { useRouter } from 'vue-router';


const router = useRouter();

type SelectedTarget =
  | { kind: 'defender'; index: number }
  | { kind: 'goalkeeper' }
  | null;

const {
  gameContext,
  sceneView,
  busy,
  init,
  attackDefender,
  attackGoalkeeper,
  doubleAttack,
  undo,
  redo,
} = usePlayingField();

const webState = computed(() => gameContext.state.value as WebGameState | null);
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

const { show: showOverlay, hide: hideOverlay } = useOverlay();

function showInfoAlert(message: string) {
  const el = createGameAlert({
    message,
    autoHideMs: 2500,
    onOk: () => hideOverlay(),
  });
  showOverlay(el, { onHide: () => el.cleanup?.() });
}

async function handleAttackDefender() {
  const sel = selectedTarget.value;
  if (!sel || sel.kind !== 'defender') {
    showInfoAlert('Pick a defender card to attack.');
    return;
  }
  try {
    await attackDefender(sel.index);
    selectedTarget.value = null;
  } catch (err: any) {
    if (err?.code === 'NO_DEFENDER_SELECTED') {
      showInfoAlert('Pick a defender card to attack.');
    } else {
      showInfoAlert('Attack failed. Please try again.');
    }
  }
}

async function handleAttackGoalkeeper() {
  try {
    await attackGoalkeeper();
    selectedTarget.value = null;
  } catch {
    showInfoAlert('Goalkeeper attack failed. Please try again.');
  }
}

async function handleDoubleAttack() {
  const sel = selectedTarget.value;
  if (!sel || sel.kind !== 'defender') {
    showInfoAlert('Pick a defender card for double attack.');
    return;
  }
  try {
    await doubleAttack(sel.index);
    selectedTarget.value = null;
  } catch {
    showInfoAlert('Double attack failed. Please try again.');
  }
}

async function handleUndo() {
  await undo();
}

async function handleRedo() {
  await redo();
}

function handleInfo() {
  showInfoAlert('Select a defender or the goalkeeper, then choose an attack.');
}

function goToDefenders() {
  router.push({ name: 'AttackerDefenders' });
}

function goToHand() {
  router.push({ name: 'AttackerHand' });
}

function handlePause() {
  console.log("Pause clicked");
  // optional pause overlay or logic
}

function handleHover(payload: { action: string }) {
  // optional sound effect or tooltip
}

onMounted(async () => {
  await init();
  console.log('[PlayingFieldView] webState after init:', webState.value);
  console.log('[PlayingFieldView] sceneView after init:', sceneView.value);
});

</script>

<template>
  <div
    class="scene scene--playingfield is-active"
    aria-live="polite"
  >
    <!-- playersBar was directly under .scene before -->
    <PlayersBar
      v-if="webState"
      :web="webState"
      :avatarRegistry="avatarRegistry"
    />

    <main
      class="board"
      role="main"
    >
      <nav
        id="nav-bar"
        aria-label="Navigation menu"
        data-href-defenders="/attacker-defenders"
        data-href-hand="/attacker-hand"
      >
        <NavButtonBar
          :busy="busy"
          @pause="handlePause"
          @go-defenders="goToDefenders"
          @go-hand="goToHand"
          @hover="handleHover"
          @undo="handleUndo"
          @redo="handleRedo"
        />
      </nav>

      <section
        id="field"
        aria-label="Defender Field"
      >
        <div
          class="card-bar-frame"
          id="field-frame"
        >
          <PlayersField
            :scene="sceneView"
            v-model:selectedTarget="selectedTarget"
            :busy="busy"
          />
        </div>
      </section>

      <aside
        id="action-bar"
        aria-label="Action buttons"
      >
        <ActionButtonBar
          :busy="busy"
          @attack-defender="handleAttackDefender"
          @attack-goalkeeper="handleAttackGoalkeeper"
          @double-attack="handleDoubleAttack"
          @info="handleInfo"
        />
      </aside>
    </main>

    <footer
      id="hand-row"
      aria-label="Attacker Hand and Avatar"
    >
      <section
        id="hand"
        aria-label="Attacker Hand"
      >
        <PlayersHand
          :scene="sceneView"
          :busy="busy"
        />
      </section>

      <section
        id="attacker-avatar-box"
        aria-label="Current Attacker"
      >
        <!-- reserved for Attacker avatar box -->
      </section>
    </footer>

    <div
      id="input-blocker"
      class="input-blocker"
      :aria-hidden="busy ? 'false' : 'true'"
      :class="{ 'is-active': busy }"
    />
  </div>
</template>
