<!-- frontend/src/components/PauseDialog.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import GameButton from '../button/GameButton.vue';

const props = defineProps<{
  onAction: (action: string) => void;
  isOnline?: boolean;
}>();

const online = computed(() => props.isOnline === true);

type PauseAction =
  | 'resume'
  | 'undo'
  | 'redo'
  | 'save'
  | 'restart'
  | 'mainmenu';

function onCommand(payload: { action: PauseAction }) {
  props.onAction(payload.action);
}
</script>

<template>
  <div
    class="overlay-actions"
    style="display:flex;flex-direction:column;gap:12px;align-items:center;"
  >
    <GameButton action="resume" label="Resume" @command="onCommand" />

    <GameButton
      v-if="!online"
      action="undo"
      label="Undo"
      @command="onCommand"
    />

    <GameButton
      v-if="!online"
      action="redo"
      label="Redo"
      @command="onCommand"
    />

    <GameButton
      v-if="!online"
      action="save"
      label="Save Game"
      @command="onCommand"
    />

    <GameButton
      v-if="!online"
      action="restart"
      label="Restart"
      @command="onCommand"
    />

    <GameButton action="mainmenu" label="Main Menu" @command="onCommand" />
  </div>
</template>
