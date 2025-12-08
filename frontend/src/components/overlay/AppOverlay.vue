<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useOverlayStore } from '../../stores/overlayStore';

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
        --safe-top: 16%;
        --safe-right: 8%;
        --safe-bottom: 16%;
        --safe-left: 8%;
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

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  pointer-events: none;
  transition: opacity 500ms ease;
  z-index: 9999;
}

.overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.overlay-frame {
  --scale-closed: 0.9;
  --scale-open: 1;
  --scale-closing: 0.8;
  --anim-dur: 500ms;

  --frame-max-w: 1100px;
  --base-w: 70vw;
  --size-mult: 1;

  width: min(calc(var(--base-w) * var(--size-mult)), var(--frame-max-w));
  aspect-ratio: 1200 / 800;
  position: relative;
  background: var(--frame-img) center / contain no-repeat;
  filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.6));

  transform: scale(var(--scale-closed));
  transition: transform var(--anim-dur) ease;
}

.overlay.visible .overlay-frame {
  transform: scale(var(--scale-open));
}

.overlay.is-closing .overlay-frame {
  transform: scale(var(--scale-closing));
}

.overlay-scroll {
  position: absolute;
  top: var(--safe-top);
  right: var(--safe-right);
  bottom: var(--safe-bottom);
  left: var(--safe-left);

  overflow-y: auto;
  overflow-x: hidden;
  padding: clamp(12px, 2vw, 22px);
  box-sizing: border-box;
  scroll-behavior: smooth;
}

.overlay-scroll::-webkit-scrollbar {
  width: 9px;
}
.overlay-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.35);
  border-radius: 6px;
}

.overlay-textflow {
  padding: 20px;
  line-height: 1.6;
  text-align: left;
  background: transparent;
  color: #e8eef5;
  font-family: 'Rajdhani', Arial, sans-serif;
  white-space: pre-line;
}
</style>
