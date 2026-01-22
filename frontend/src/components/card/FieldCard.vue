<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { createCardAnimations } from '../../utils/cardAnimations';
import type { SlotLike, FieldCardData, FieldSlot } from '../../types/FieldCards';
import defeatedPng from '@/assets/images/cards/defeated.png';
import { createCardImageRegistry } from '@/utils/cardImageRegistry';

const cardRegistry = createCardImageRegistry();

const props = withDefaults(
  defineProps<{
    card: SlotLike;
    index?: number | string;
    role?: 'defender' | 'goalkeeper';
    cardBaseUrl?: string;
    defeatedImg?: string;
    boostImg?: string;
    selected?: boolean;
    clickable?: boolean;
  }>(),
  {
    role: 'defender',
    cardBaseUrl: '/assets/images/cards/',
    defeatedImg: defeatedPng,
    boostImg: undefined,
    selected: false,
    clickable: true,
  },
);


const emit = defineEmits<{
  (e: 'select'): void;
  (e: 'click', event: MouseEvent): void;
}>();

const rootEl = ref<HTMLElement | null>(null);

function isFieldSlot(v: SlotLike): v is FieldSlot {
  return !!v && typeof v === 'object' && 'card' in v;
}

const data = computed<FieldCardData | null>(() => {
  if (!props.card) return null;
  if (isFieldSlot(props.card)) {
    return (props.card.card ?? null) as FieldCardData | null;
  }
  return props.card as FieldCardData;
});

function isBoostedCard(d?: FieldCardData | null): boolean {
  if (!d) return false;
  const anyData = d as any;
  return (
    !!d.isBoosted ||
    !!anyData.boosted ||
    anyData.kind === 'BoostedCard' ||
    anyData.type === 'BoostedCard' ||
    anyData.cardType === 'BoostedCard'
  );
}

const isBoosted = computed<boolean>(() => {
  const raw: any = props.card;
  if (raw && (raw.isBoosted || raw.boosted)) {
    return true;
  }
  return isBoostedCard(data.value);
});

const imageUrl = computed<string | null>(() => {
  const d: any = data.value;
  if (!d) return null;

  if (d.img) return d.img as string;

  const fileName: string | null | undefined =
    d.fileName ?? d.card?.fileName ?? null;

  if (fileName) {
    return cardRegistry.getImageForCard(fileName);
  }

  return null;
});


const isDefeated = computed<boolean>(() => {
  const d: any = data.value;
  if (d && typeof d.isDefeated === 'boolean') {
    return d.isDefeated;
  }
  return !imageUrl.value;
});


const classes = computed(() => ({
  'field-card': true,
  'game-card': true,
  goalkeeper: props.role === 'goalkeeper',
  'is-selected': props.selected,
  'is-defeated': isDefeated.value,
  'is-boosted': isBoosted.value,
  'field-card--readonly': !props.clickable,
}));

const anim = createCardAnimations(
  props.boostImg ? { boostImg: props.boostImg } : undefined,
);

function applyAnimations() {
  const el = rootEl.value;
  if (!el) return;

  if (isDefeated.value) {
    el.style.backgroundImage = `url("${props.defeatedImg}")`;
    anim.applyDefeatedEffect(el);
  } else {
    if (typeof (anim as any).removeDefeatedEffect === 'function') {
      (anim as any).removeDefeatedEffect(el);
    }
  }

  if (imageUrl.value && !isDefeated.value) {
    el.style.backgroundImage = `url("${imageUrl.value}")`;
  }

  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';

  if (isBoosted.value) {
    anim.applyBoostEffect(el);
  } else {
    anim.removeBoostEffect(el);
  }
}

onMounted(() => {
  applyAnimations();
});

watch(
  () => [imageUrl.value, isBoosted.value, props.card],
  () => {
    applyAnimations();
  },
);

function handleClick(event: MouseEvent) {

  if (isDefeated.value || !props.clickable) {
    return;
  }
  emit('select');
  emit('click', event);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick(event as any as MouseEvent);
  }
}
</script>

<template>
  <div
    ref="rootEl"
    :class="classes"
    :data-index="index"
    :role="clickable ? 'button' : 'presentation'"
    :tabindex="clickable ? 0 : -1"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <slot :card="data" />
  </div>
</template>

<style scoped>
.field-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.field-card:hover {
  box-shadow: var(--shadow-hover, 0 14px 28px rgba(0, 0, 0, 0.55));
  transform: translateY(-2px) scale(1.03);
}

.field-card--readonly {
  cursor: default;
}

.field-card--readonly:hover {
  transform: none;
  box-shadow: none;
}

/* Selection highlight */
.field-card.is-selected {
  outline: 3px solid rgba(255, 215, 0, 0.9);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
}
</style>
