<template>
  <button
    ref="btnRef"
    class="gbtn game-btn"
    type="button"
    :data-action="action"
    :disabled="isDisabled"
    :title="tooltip"
    :aria-label="ariaLabel"
    @click="onClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <span
      v-if="showSpinner"
      class="game-btn-spinner"
      aria-hidden="true"
    ></span>

    <span v-if="$slots.icon" class="game-btn-icon">
      <slot name="icon" />
    </span>

    <span class="game-btn-label">
      <slot>{{ label }}</slot>
    </span>

    <span v-if="hotkey" class="game-btn-hotkey-badge">
      {{ normalizedHotkeyDisplay }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

type GameCommandType = string;

const props = withDefaults(
  defineProps<{
    action: GameCommandType;
    label?: string;

    busy?: boolean;
    disabled?: boolean;
    canExecute?: boolean;
    disableOnBusy?: boolean;
    showBusySpinner?: boolean;
    tooltip?: string;
    hotkey?: string;
  }>(),
  {
    label: '',
    busy: false,
    disabled: false,
    canExecute: true,
    disableOnBusy: true,
    showBusySpinner: true,
    tooltip: '',
    hotkey: undefined,
  },
);

const emit = defineEmits<{
  (e: 'command', payload: { action: GameCommandType }): void;
  (e: 'hover', payload: { action: GameCommandType; hovering: boolean }): void;
  (e: 'hotkey', payload: { action: GameCommandType; key: string }): void;
}>();

const btnRef = ref<HTMLButtonElement | null>(null);

const isDisabled = computed(() => {
  if (props.disabled) return true;
  if (props.disableOnBusy && props.busy) return true;
  if (!props.canExecute) return true;
  return false;
});

const showSpinner = computed(() => props.showBusySpinner && props.busy);

const ariaLabel = computed(
  () => props.tooltip || props.label || String(props.action),
);

const normalizedHotkey = computed(() =>
  (props.hotkey ?? '').trim().toLowerCase(),
);

const normalizedHotkeyDisplay = computed(
  () => props.hotkey?.toUpperCase() ?? '',
);

function onClick() {
  if (isDisabled.value) return;
  emit('command', { action: props.action });
}

function onMouseEnter() {
  emit('hover', { action: props.action, hovering: true });
}

function onMouseLeave() {
  emit('hover', { action: props.action, hovering: false });
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (!normalizedHotkey.value) return;
  if (isDisabled.value) return;

  if (e.key.toLowerCase() === normalizedHotkey.value) {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      ['input', 'textarea', 'select'].includes(
        target.tagName.toLowerCase(),
      )
    ) {
      return;
    }

    e.preventDefault();
    emit('hotkey', { action: props.action, key: e.key });
    btnRef.value?.click();
  }
}

onMounted(() => {
  if (props.hotkey) {
    window.addEventListener('keydown', onGlobalKeydown);
  }
});

onBeforeUnmount(() => {
  if (props.hotkey) {
    window.removeEventListener('keydown', onGlobalKeydown);
  }
});
</script>

<style scoped>
.game-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding-inline: 1.2rem;
}

.game-btn-spinner {
  width: 1em;
  height: 1em;
  border-radius: 999px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: game-btn-spin 0.7s linear infinite;
}

.game-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.game-btn-label {
  white-space: nowrap;
}

.game-btn-hotkey-badge {
  font-size: 0.7em;
  opacity: 0.8;
  border-radius: 0.25rem;
  padding: 0.1rem 0.3rem;
  border: 1px solid currentColor;
}

@keyframes game-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
