<!-- frontend/src/components/FieldCard.vue -->
<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { createCardAnimations } from '../utils/cardAnimations';
import type { SlotLike, FieldCardLike , FieldCardData, FieldSlot} from '../types/FieldCards';
/**
 * Types from your TS renderer:
 * - FieldCardData { fileName?: string; isBoosted?: boolean; ... }
 * - FieldSlot { id?: string; card?: FieldCardData | null; ... }
 */

const props = withDefaults(
  defineProps<{
    card: SlotLike;

    /** index used for data-index and selection logic */
    index?: number | string;

    /** defender or goalkeeper – only affects the extra CSS class */
    role?: 'defender' | 'goalkeeper';

    /** Asset config – mirrors FieldCardRendererAssets defaults */
    cardBaseUrl?: string;
    defeatedImg?: string;
    boostImg?: string;

    /** selection state (for .is-selected) */
    selected?: boolean;

    /** can this card be clicked / focused? */
    clickable?: boolean;
  }>(),
  {
    role: 'defender',
    cardBaseUrl: '/assets/images/cards/',
    defeatedImg: '/assets/images/cards/defeated.png',
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

// ----------------- helpers like in TS renderer -----------------

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

const imageUrl = computed<string | null>(() => {
  const d = data.value;
  if (!d?.fileName) return null;
  return `${props.cardBaseUrl}${d.fileName}.png`;
});

const isDefeated = computed<boolean>(() => !imageUrl.value);
const isBoosted = computed<boolean>(() => isBoostedCard(data.value));

const classes = computed(() => ({
  'field-card': true,
  'game-card': true,
  goalkeeper: props.role === 'goalkeeper',
  'is-selected': props.selected,
  'is-defeated': isDefeated.value,
  'is-boosted': isBoosted.value,
  'field-card--readonly': !props.clickable,
}));

// Reuse your cardAnimations (boost & defeated effects)
const anim = createCardAnimations(
  props.boostImg ? { boostImg: props.boostImg } : undefined,
);

function applyAnimations() {
  const el = rootEl.value;
  if (!el) return;

  if (isDefeated.value) {
    // defeated image or effect
    el.style.backgroundImage = `url("${props.defeatedImg}")`;
    anim.applyDefeatedEffect(el);
  } else {
    // ⭐ restore normal appearance if this slot is no longer defeated
    if (typeof anim.removeDefeatedEffect === 'function') {
      anim.removeDefeatedEffect(el);
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

// ----------------- events -----------------

function handleClick(event: MouseEvent) {
  console.log('[FieldCard] clicked; isDefeated=', isDefeated.value, 'clickable=', props.clickable, 'index=', props.index);

  if (isDefeated.value || !props.clickable) {
    console.log('[FieldCard] click ignored');
    return;
  }
  console.log('[FieldCard] emitting select');
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
    <!-- optional slot if you want overlay content (value text, etc.) -->
    <slot :card="data" />
  </div>
</template>

<style scoped>
.field-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.field-card:hover {
  transform: translateY(-2px) scale(1.03);
}

.field-card--readonly:hover {
  transform: none;
  cursor: default;
}
</style>
