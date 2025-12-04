<!-- frontend/src/components/HandCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { HandCardLike } from '../types/HandCards';

const props = defineProps<{
  card: HandCardLike;
  index: number;
  overlap: number;
  selected?: boolean;
  clickable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select'): void;
}>();

const isClickable = computed(() => props.clickable !== false);

const cardStyle = computed(() => {
  const styles: Record<string, string> = {
    marginLeft: props.index === 0 ? '0px' : `${props.overlap}px`,
    zIndex: String(props.index + 1),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const url = (props.card as any)?.img as string | undefined;
  if (url) {
    styles.backgroundImage = `url("${url}")`;
  }

  if (!isClickable.value) {
    styles.cursor = 'default';
  }

  return styles;
});

function onSelect() {
  if (!isClickable.value) return;
  emit('select');
}
</script>

<template>
  <div
    class="hand-card game-card"
    :class="{
      'hand-card--selected': !!selected,
      'hand-card--readonly': !isClickable,
    }"
    :data-index="index"
    :role="isClickable ? 'button' : 'presentation'"
    :tabindex="isClickable ? 0 : -1"
    :aria-pressed="isClickable ? (selected ? 'true' : 'false') : undefined"
    :style="cardStyle"
    @click="onSelect"
    @keydown.enter.prevent="onSelect"
    @keydown.space.prevent="onSelect"
  />
</template>

<style scoped>
.hand-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.hand-card:hover {
  transform: translateY(-2px) scale(1.05);
}

.hand-card--selected {
  outline: 2px solid #ffd54f;
  box-shadow: 0 0 8px rgba(255, 213, 79, 0.9);
}

.hand-card--readonly {
}
</style>
