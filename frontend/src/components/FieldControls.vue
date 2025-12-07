<!-- frontend/src/components/FieldControls.vue -->
<script setup lang="ts">
import GameButton from './GameButton.vue';

const props = withDefaults(
  defineProps<{
    busy?: boolean;
    canBoost?: boolean;
  }>(),
  {
    busy: false,
    canBoost: true,
  },
);

const emit = defineEmits<{
  (e: 'boost'): void;
  (e: 'info'): void;
  (e: 'back'): void;
}>();

type FieldAction = 'boost' | 'info' | 'back';

function onCommand(payload: { action: FieldAction }) {
  switch (payload.action) {
    case 'boost':
      emit('boost');
      break;
    case 'info':
      emit('info');
      break;
    case 'back':
      emit('back');
      break;
  }
}
</script>

<template>
  <div
    class="scene__buttons"
    role="group"
    aria-label="Actions"
    :aria-busy="busy ? 'true' : 'false'"
  >
    <GameButton
      id="btn-boost"
      class="gbtn--lg"
      action="boost"
      label="Boost Card"
      :busy="busy"
      :can-execute="canBoost"
      tooltip="Boost the selected defender card"
      @command="onCommand"
    />

    <GameButton
      id="btn-info"
      action="info"
      label="Info"
      :busy="busy"
      tooltip="Show info about boosting"
      @command="onCommand"
    />

    <GameButton
      id="btn-back"
      action="back"
      label="Back to Game"
      :busy="busy"
      tooltip="Return to the main game view"
      @command="onCommand"
    />
  </div>
</template>
