<!-- frontend/src/components/NavButtonBar.vue -->
<script setup lang="ts">
import GameButton from './GameButton.vue';

type NavAction = 'pause' | 'show-defenders' | 'make-swap';

const props = defineProps<{
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: 'pause'): void;
  (e: 'go-defenders'): void;
  (e: 'go-hand'): void;
  (e: 'hover', payload: { action: string }): void;
}>();

function onCommand(payload: { action: NavAction }) {
  console.log('[NavButtonBar] Command received:', payload);

  switch (payload.action) {
    case 'pause':
      emit('pause');
      break;

    case 'show-defenders':
      emit('go-defenders');
      break;

    case 'make-swap':
      emit('go-hand');
      break;
  }
}

function onHover(payload: { action: NavAction; hovering: boolean }) {
  if (props.busy) return;

  if (payload.hovering) {
    emit('hover', { action: payload.action });
  } else {
    // emit('hover', { action: '' });
  }
}
</script>

<template>
  <div class="nav-button-bar">
    <GameButton
      action="pause"
      label="Pause"
      :busy="busy"
      tooltip="Pause game / AI"
      @command="onCommand"
      @hover="onHover"
    />

    <GameButton
      action="show-defenders"
      label="Show Defenders"
      :busy="busy"
      tooltip="Jump to defenders view"
      @command="onCommand"
      @hover="onHover"
    />

    <GameButton
      action="make-swap"
      label="Make Swap"
      :busy="busy"
      tooltip="Jump back to hand / swap view"
      @command="onCommand"
      @hover="onHover"
    />
  </div>
</template>

<style scoped>
.nav-button-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 8px 0;

  font-family: "Rajdhani", Arial, sans-serif;
}

@media (max-width: 768px) {
  .nav-button-bar {
    gap: 8px;
    padding: 6px 0;
  }
}

@media (max-width: 480px) {
  .nav-button-bar {
    gap: 6px;
    padding: 4px 0;
  }
}
</style>