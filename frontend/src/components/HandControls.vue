<!-- frontend/src/components/HandControls.vue -->
<script setup lang="ts">
import GameButton from './GameButton.vue';

const props = withDefaults(
  defineProps<{
    busy?: boolean;
  }>(),
  {
    busy: false,
  },
);

const emit = defineEmits<{
  (e: 'swap'): void;
  (e: 'reverse-swap'): void;
  (e: 'info'): void;
  (e: 'back'): void;
}>();

type HandAction = 'swap' | 'reverse-swap' | 'info' | 'back';

function onCommand(payload: { action: HandAction }) {
  switch (payload.action) {
    case 'swap':
      emit('swap');
      break;
    case 'reverse-swap':
      emit('reverse-swap');
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
      id="btn-regular-swap"
      class="gbtn--lg"
      action="swap"
      label="Regular Swap"
      :busy="busy"
      tooltip="Swap the positions of two cards"
      @command="onCommand"
    />

    <GameButton
      id="btn-reverse-swap"
      class="gbtn--lg"
      action="reverse-swap"
      label="Reverse Swap"
      :busy="busy"
      tooltip="Swap cards in the opposite order"
      @command="onCommand"
    />

    <GameButton
      id="btn-info"
      action="info"
      label="Info"
      :busy="busy"
      tooltip="Show swap instructions"
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

<style scoped>
.scene__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
