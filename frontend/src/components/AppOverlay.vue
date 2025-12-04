<!-- frontend/src/components/AppOverlay.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useOverlayStore } from '../stores/overlayStore';

const overlayStore = useOverlayStore();

const {
  visible,
  isClosing,
  title,
  message,
  content,
  componentProps,
  hide,
} = overlayStore;

function onBackgroundClick() {
  hide();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && visible.value) {
    e.preventDefault();
    hide();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div
    class="overlay"
    :class="{
      visible: visible && !isClosing,
      'is-closing': isClosing,
    }"
    role="dialog"
    aria-modal="true"
    :aria-hidden="!(visible && !isClosing)"
    @mousedown.self="onBackgroundClick"
  >
    <div
      class="overlay-frame"
      style="
        --frame-img: url('/assets/images/frames/overlay.png');
        --safe-top: 8%;
        --safe-right: 6%;
        --safe-bottom: 12%;
        --safe-left: 6%;
      "
    >
      <div class="overlay-scroll">
        <div class="overlay-textflow">
          <div class="dialog-title">
            {{ title }}
          </div>

          <div
            v-if="message"
            class="dialog-message"
          >
            {{ message }}
          </div>

          <component
            v-if="content"
            :is="content"
            v-bind="componentProps ?? {}"
          />
        </div>
      </div>
    </div>
  </div>
</template>
