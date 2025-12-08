<!-- frontend/src/components/ActionButtonBar.vue -->
<script setup lang="ts">
import GameButton from './GameButton.vue';

type ActionCmd = 'attack-defender' | 'attack-double' | 'info';

const props = defineProps<{
  busy?: boolean;
  canAttack?: boolean;
  canDoubleAttack?: boolean;
}>();

const emit = defineEmits<{
  (e: 'attack-defender'): void;
  (e: 'attack-goalkeeper'): void;
  (e: 'double-attack'): void;
  (e: 'info'): void;
  (e: 'hover', payload: { action: string }): void;
}>();

function onCommand(payload: { action: ActionCmd }) {
  switch (payload.action) {
    case 'attack-defender':
      emit('attack-defender');
      break;

    case 'attack-double':
      emit('double-attack');
      break;

    case 'info':
      emit('info');
      break;
  }
}

function onHover(payload: { action: ActionCmd; hovering: boolean }) {
  if (props.busy) return;
  if (payload.hovering) {
    emit('hover', { action: payload.action });
  }
}
</script>

<template>
  <div class="action-button-bar">
    <GameButton
      action="attack-defender"
      label="Attack"
      :busy="busy"
      tooltip="Attack a defender"
      @command="onCommand"
      @hover="onHover"
    />

    <GameButton
      action="attack-double"
      label="Double Attack"
      :busy="busy"
      tooltip="Perform a double card attack"
      @command="onCommand"
      @hover="onHover"
    />

    <GameButton
      action="info"
      label="Info"
      :busy="busy"
      tooltip="Show game info or hints"
      @command="onCommand"
      @hover="onHover"
    />
  </div>
</template>
