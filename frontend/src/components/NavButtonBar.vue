<!-- frontend/src/components/NavButtonBar.vue -->
<script setup lang="ts">

const props = defineProps<{
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: 'pause'): void;
  (e: 'go-defenders'): void;
  (e: 'go-hand'): void;
  (e: 'hover', payload: { action: string }): void;
}>();

function onPauseClick() {
  console.log('[NavButtonBar] Pause clicked, busy=', props.busy);
  if (props.busy) return;
  emit('pause');
}


function onShowDefendersClick() {
  if (props.busy) return;
  emit('go-defenders');
}

function onMakeSwapClick() {
  if (props.busy) return;
  emit('go-hand');
}

function onHover(action: string) {
  if (props.busy) return;
  emit('hover', { action });
}
</script>

<template>
  <div class="nav-button-bar">
    <button
      class="gbtn"
      type="button"
      data-action="pause"
      :disabled="busy"
      @click="onPauseClick"
      @mouseenter="onHover('pause')"
    >
      Pause
    </button>

    <button
      class="gbtn"
      type="button"
      data-action="show-defenders"
      :disabled="busy"
      @click="onShowDefendersClick"
      @mouseenter="onHover('show-defenders')"
    >
      Show Defenders
    </button>

    <button
      class="gbtn"
      type="button"
      data-action="make-swap"
      :disabled="busy"
      @click="onMakeSwapClick"
      @mouseenter="onHover('make-swap')"
    >
      Make Swap
    </button>
  </div>
</template>
