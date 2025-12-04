<!-- frontend/src/components/ActionButtonBar.vue -->
<script setup lang="ts">
const props = defineProps<{
  busy?: boolean;
  canAttack?: boolean;        // kept for future use
  canDoubleAttack?: boolean;
}>();

const emit = defineEmits<{
  (e: 'attack-defender'): void;
  (e: 'attack-goalkeeper'): void;
  (e: 'double-attack'): void;
  (e: 'info'): void;
  (e: 'hover', payload: { action: string }): void;
}>();

function onAttackClick() {
  console.log('[ActionButtonBar] Attack clicked, busy=', props.busy);
  emit('attack-defender');
}

function onDoubleAttackClick() {
  console.log('[ActionButtonBar] Double Attack clicked, busy=', props.busy);
  emit('double-attack');
}

function onInfoClick() {
  console.log('[ActionButtonBar] Info clicked, busy=', props.busy);
  emit('info');
}

function onHover(action: string) {
  if (props.busy) return;
  emit('hover', { action });
}
</script>

<template>
  <div class="action-button-bar">
    <button
      type="button"
      class="gbtn"
      data-action="attack-regular"
      @click="onAttackClick"
      @mouseenter="onHover('attack-defender')"
    >
      Attack
    </button>

    <button
      type="button"
      class="gbtn"
      data-action="attack-double"
      @click="onDoubleAttackClick"
      @mouseenter="onHover('attack-double')"
    >
      Double Attack
    </button>

    <button
      type="button"
      class="gbtn"
      data-action="info"
      @click="onInfoClick"
      @mouseenter="onHover('info')"
    >
      Info
    </button>
  </div>
</template>
