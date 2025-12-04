<!-- frontend/src/components/FieldControls.vue -->
<script setup lang="ts">
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

function onBoost() {
  if (props.busy || !props.canBoost) return;
  emit('boost');
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
  <div
    class="scene__buttons"
    role="group"
    aria-label="Actions"
    :aria-busy="busy ? 'true' : 'false'"
  >
    <button
      id="btn-boost"
      class="gbtn gbtn--lg"
      type="button"
      :disabled="busy || !canBoost"
      @click="onBoost"
    >
      Boost Card
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
