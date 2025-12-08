<!-- frontend/src/views/PlayingFieldView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { usePlayingField } from '../composables/usePlayingField';
import PlayersBar from '../components/player/PlayersBar.vue';
import NavButtonBarContainer from '../components/button/NavButtonBarContainer.vue';
import PlayersField from '../components/field/PlayersField.vue';
import PlayersHand from '../components/hand/PlayersHand.vue';
import ActionButtonBar from '../components/button/ActionButtonBar.vue';
import { createPlayerAvatarRegistry } from '../utils/playerAvatarRegistry';
import { useOverlay } from '../composables/useOverlay';
import type { PlayerLike, WebGameState } from '../types/WebGameState';

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

const { show, hide } = useOverlay();

function showInfoAlert(message: string) {
  show({
    title: 'Info',
    message,
    content: null,
  });
}


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

  if (sel.kind === 'goalkeeper') {
    console.log('[PlayingFieldView] primary attack routed to goalkeeper');
    await handleAttackGoalkeeper();
    return;
  }

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

function handleInfo() {
  showInfoAlert('Select a defender or the goalkeeper, then choose an attack.');
}

onMounted(async () => {
  await init();
  console.log('[PlayingFieldView] webState after init:', webState.value);
  console.log('[PlayingFieldView] sceneView after init:', sceneView.value);
});

watch(
  webState,
  (st) => {
    if (!st) return;
  },
  { immediate: false },
);

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
        <NavButtonBarContainer :busy="busy" />
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

      <aside id="action-bar" aria-label="Action buttons">
        <ActionButtonBar
          :busy="busy"
          @attack-defender="handleAttackDefender"
          @attack-goalkeeper="handleAttackGoalkeeper"
          @double-attack="handleDoubleAttack"
          @info="handleInfo"
        />
      </aside>
    </main>

    <footer id="hand-row" aria-label="Attacker Hand and Avatar">
      <section id="hand" aria-label="Attacker Hand">
        <PlayersHand :scene="sceneView" :busy="busy" />
      </section>

      <section id="attacker-avatar-box" aria-label="Current Attacker">
      </section>
    </footer>
  </div>
</template>
