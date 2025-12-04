<!-- frontend/src/components/ActionButtonBar.vue -->
<script setup lang="ts">
/**
 * Vue version of the old createActionButtonBar.
 * - No jQuery
 * - No direct overlay usage
 * - Parent decides what happens on click/hover
 */

const props = defineProps<{
  busy?: boolean;

  // fine-grained enable flags
  canAttack?: boolean;
  canDoubleAttack?: boolean;
}>();

const emit = defineEmits<{
  (e: 'attack-defender'): void;
  (e: 'double-attack'): void;
  (e: 'info'): void;
  (e: 'hover', payload: { action: string }): void;
}>();

function onAttackClick() {
  if (props.busy) return;
  emit('attack-defender');
}

function onDoubleAttackClick() {
  if (props.busy) return;
  emit('double-attack');
}

function onInfoClick() {
  if (props.busy) return;
  emit('info');
}

function onHover(action: string) {
  if (props.busy) return;
  emit('hover', { action });
}
</script>

<template>
  <!-- acts as the old #action-bar content -->
  <div class="action-button-bar">
    <button
      type="button"
      class="gbtn"
      data-action="attack-regular"
      :disabled="busy || canAttack === false"
      @click="onAttackClick"
      @mouseenter="onHover('attack-defender')"
    >
      Attack
    </button>

    <button
      type="button"
      class="gbtn"
      data-action="attack-double"
      :disabled="busy || canDoubleAttack === false"
      @click="onDoubleAttackClick"
      @mouseenter="onHover('attack-double')"
    >
      Double Attack
    </button>

    <button
      type="button"
      class="gbtn"
      data-action="info"
      :disabled="busy"
      @click="onInfoClick"
      @mouseenter="onHover('info')"
    >
      Info
    </button>
  </div>
</template>
