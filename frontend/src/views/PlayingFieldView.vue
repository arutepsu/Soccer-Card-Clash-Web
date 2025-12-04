<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayingField } from '../composables/usePlayingField';
import PlayersBar from '../components/PlayersBar.vue';
import NavButtonBar from '../components/NavButtonBar.vue';
import PlayersField from '../components/PlayersField.vue';
import PlayersHand from '../components/PlayersHand.vue';
import ActionButtonBar from '../components/ActionButtonBar.vue';
import { createPlayerAvatarRegistry } from '../utils/playerAvatarRegistry';
import { useOverlay } from '../composables/useOverlay';
import { createGameAlert } from '../ui/gameAlertFactory';
import type { WebGameState } from '../types/WebGameState';

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

const webState = computed(
  () => gameContext.state.value as WebGameState | null,
);

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

// overlay composable
const { show: showOverlay, hide: hideOverlay } = useOverlay();

function showInfoAlert(message: string) {
  // Fallback if no overlay service is available
  if (!showOverlay) {
    console.warn(
      '[PlayingFieldView] showOverlay is null – using window.alert fallback',
    );
    window.alert(message);
    return;
  }

  const el = createGameAlert({
    message,
    autoHideMs: 2500,
    onOk: () => {
      if (hideOverlay) {
        hideOverlay();
      }
    },
  });

  showOverlay(el, { onHide: () => el.cleanup?.() });
}

// --- selection handlers from PlayersField ---

function handleDefenderSelected(index: number | null) {
  if (index == null) {
    selectedTarget.value = null;
  } else {
    selectedTarget.value = { kind: 'defender', index };
  }
  console.log('[PlayingFieldView] defender-selected ->', selectedTarget.value);
}

function handleGoalkeeperSelected(selected: boolean) {
  selectedTarget.value = selected ? { kind: 'goalkeeper' } : null;
  console.log('[PlayingFieldView] goalkeeper-selected ->', selectedTarget.value);
}

// --- buttons -> usePlayingField ---

async function handleAttackDefender() {
  console.log(
    '[PlayingFieldView] handleAttackDefender, selectedTarget:',
    selectedTarget.value,
  );

  const sel = selectedTarget.value;

  if (!sel) {
    showInfoAlert('Pick a defender or the goalkeeper to attack.');
    return;
  }

  // ✅ If goalkeeper is selected, route to goalkeeper attack
  if (sel.kind === 'goalkeeper') {
    console.log('[PlayingFieldView] primary attack routed to goalkeeper');
    await handleAttackGoalkeeper();
    return;
  }

  // ✅ Defender case
  if (sel.kind !== 'defender') {
    showInfoAlert('Pick a defender card to attack.');
    return;
  }

  try {
    console.log(
      '[PlayingFieldView] calling attackDefender with index:',
      sel.index,
    );
    await attackDefender(sel.index);
    console.log('[PlayingFieldView] attackDefender finished');
  } catch (err: any) {
    console.error('[PlayingFieldView] attackDefender error:', err);
    showInfoAlert('Attack failed. Please try again.');
  } finally {
    selectedTarget.value = null;
  }
}

async function handleAttackGoalkeeper() {
  try {
    console.log('[PlayingFieldView] handleAttackGoalkeeper');
    await attackGoalkeeper();
    console.log('[PlayingFieldView] attackGoalkeeper finished');
  } catch (err) {
    console.error('[PlayingFieldView] attackGoalkeeper error:', err);
    showInfoAlert('Goalkeeper attack failed. Please try again.');
  } finally {
    selectedTarget.value = null;
  }
}

async function handleDoubleAttack() {
  const sel = selectedTarget.value;
  console.log(
    '[PlayingFieldView] handleDoubleAttack, selectedTarget:',
    sel,
  );

  if (!sel || sel.kind !== 'defender') {
    showInfoAlert('Pick a defender card for double attack.');
    return;
  }
  try {
    console.log(
      '[PlayingFieldView] calling doubleAttack with index:',
      sel.index,
    );
    await doubleAttack(sel.index);
    console.log('[PlayingFieldView] doubleAttack finished');
  } catch (err) {
    console.error('[PlayingFieldView] doubleAttack error:', err);
    showInfoAlert('Double attack failed. Please try again.');
  } finally {
    selectedTarget.value = null;
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
  console.log('Pause clicked');
}

function handleHover(payload: { action: string }) {
  // optional sound / tooltip
}

onMounted(async () => {
  await init();
  console.log('[PlayingFieldView] webState after init:', webState.value);
  console.log('[PlayingFieldView] sceneView after init:', sceneView.value);
});
</script>

<template>
  <div class="scene scene--playingfield is-active" aria-live="polite">
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

      <section id="field" aria-label="Defender Field">
        <div class="card-bar-frame" id="field-frame">
          <PlayersField
            :scene="sceneView"
            :busy="busy"
            @defender-selected="handleDefenderSelected"
            @goalkeeper-selected="handleGoalkeeperSelected"
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

        <!-- DEBUG button -->
        <button
          type="button"
          class="gbtn"
          @click="() => console.log('[PlayingFieldView] OUTER test button clicked')"
        >
          Outer Test
        </button>
      </aside>

    </main>

    <footer id="hand-row" aria-label="Attacker Hand and Avatar">
      <section id="hand" aria-label="Attacker Hand">
        <PlayersHand :scene="sceneView" :busy="busy" />
      </section>

      <section id="attacker-avatar-box" aria-label="Current Attacker">
        <!-- attacker avatar here later -->
      </section>
    </footer>

    <!-- input blocker currently disabled -->
    <!--
    <div
      id="input-blocker"
      class="input-blocker"
      :aria-hidden="busy ? 'false' : 'true'"
      :class="{ 'is-active': busy }"
    />
    -->
  </div>
</template>
