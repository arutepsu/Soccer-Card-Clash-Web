<!-- frontend/src/components/HandControls.vue -->
<script setup lang="ts">
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

function onSwap() {
  if (props.busy) return;
  emit('swap');
}

function onReverseSwap() {
  if (props.busy) return;
  emit('reverse-swap');
}

function onInfo() {
  if (props.busy) return;
  emit('info');
}

function onBack() {
  if (props.busy) return;
  emit('back');
}
</script>

<template>
  <!-- Root mirrors old .scene__buttons wrapper -->
  <div
    class="scene__buttons"
    role="group"
    aria-label="Actions"
    :aria-busy="busy ? 'true' : 'false'"
  >
    <button
      id="btn-regular-swap"
      class="gbtn gbtn--lg"
      type="button"
      :disabled="busy"
      @click="onSwap"
    >
      Regular Swap
    </button>

    <button
      id="btn-reverse-swap"
      class="gbtn gbtn--lg"
      type="button"
      :disabled="busy"
      @click="onReverseSwap"
    >
      Reverse Swap
    </button>

    <button
      id="btn-info"
      class="gbtn"
      type="button"
      :disabled="busy"
      @click="onInfo"
    >
      Info
    </button>

    <!-- Use button instead of <a>, but keep id + class for same styling -->
    <button
      id="btn-back"
      class="gbtn"
      type="button"
      :disabled="busy"
      @click="onBack"
    >
      Back to Game
    </button>
  </div>
</template>

<style scoped>
/* Optional: extra spacing if needed; your old CSS will mostly govern layout */
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
