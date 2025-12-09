<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import type { PlayerInfo, ComparisonCard } from '@/utils/playingField/comparisonDialogHandler';
import {
  showSingleComparison,
  showDoubleComparison,
  showTieComparison,
  showDoubleTieComparison,
} from '@/utils/playingField/comparisonDialogGenerator';

type Variant = 'single' | 'double' | 'tie' | 'doubleTie';

const props = defineProps<{
  visible: boolean;
  variant: Variant;

  attacker: PlayerInfo;
  defender: PlayerInfo;

  attackingCard: ComparisonCard | null;
  defendingCard: ComparisonCard | null;

  attackingCard2?: ComparisonCard | null;

  extraAttackerCard?: ComparisonCard | null;
  extraDefenderCard?: ComparisonCard | null;

  attackSuccess?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
let currentNode: HTMLElement | null = null;

function cleanupNode() {
  if (currentNode && currentNode.parentElement) {
    currentNode.parentElement.removeChild(currentNode);
  }
  currentNode = null;
}

function renderDialog() {
  if (!containerRef.value) return;

  cleanupNode();
  containerRef.value.innerHTML = '';

  if (!props.visible) return;

  const {
    attacker,
    defender,
    attackingCard,
    attackingCard2,
    defendingCard,
    extraAttackerCard,
    extraDefenderCard,
  } = props;

  let node: HTMLElement | null = null;

  switch (props.variant) {
    case 'single':
      if (!attackingCard || !defendingCard) return;
      node = showSingleComparison(
        attacker,
        defender,
        attackingCard,
        defendingCard,
        !!props.attackSuccess,
      );
      break;

    case 'double':
      if (!attackingCard || !attackingCard2 || !defendingCard) return;
      node = showDoubleComparison(
        attacker,
        defender,
        attackingCard,
        attackingCard2,
        defendingCard,
        !!props.attackSuccess,
      );
      break;

    case 'tie':
      if (!attackingCard || !defendingCard || !extraAttackerCard || !extraDefenderCard) return;
      node = showTieComparison(
        attacker,
        defender,
        attackingCard,
        defendingCard,
        extraAttackerCard,
        extraDefenderCard,
      );
      break;

    case 'doubleTie':
      if (
        !attackingCard ||
        !attackingCard2 ||
        !defendingCard ||
        !extraAttackerCard ||
        !extraDefenderCard
      ) return;
      node = showDoubleTieComparison(
        attacker,
        defender,
        attackingCard,
        attackingCard2,
        defendingCard,
        extraAttackerCard,
        extraDefenderCard,
      );
      break;
  }

  if (node) {
    currentNode = node;
    containerRef.value.appendChild(node);
  }
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close');
  }
}

onMounted(() => {
  renderDialog();
});

onBeforeUnmount(() => {
  cleanupNode();
});

watch(
  () => ({
    visible: props.visible,
    variant: props.variant,
    attacker: props.attacker,
    defender: props.defender,
    attackingCard: props.attackingCard,
    attackingCard2: props.attackingCard2,
    defendingCard: props.defendingCard,
    extraAttackerCard: props.extraAttackerCard,
    extraDefenderCard: props.extraDefenderCard,
    attackSuccess: props.attackSuccess,
  }),
  () => {
    renderDialog();
  },
  { deep: true },
);
</script>

<template>
  <transition name="cmp-fade">
    <div
      v-if="visible"
      class="cmp-dialog-backdrop"
      @click="onBackdropClick"
    >
      <div class="cmp-dialog-shell">
        <div class="cmp-dialog-content" ref="containerRef" />
      </div>
    </div>
  </transition>
</template>

<style scoped>

.cmp-dialog-shell {
  max-width: min(1280px, 95vw);
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.cmp-dialog-content {
  width: 100%;
}

.cmp-fade-enter-active,
.cmp-fade-leave-active {
  transition: opacity 200ms ease-out;
}

.cmp-fade-enter-from,
.cmp-fade-leave-to {
  opacity: 0;
}
</style>
