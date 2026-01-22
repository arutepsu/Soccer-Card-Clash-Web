<script setup lang="ts">
import { computed, ref } from 'vue'
import CarouselCard from './CarouselCard.vue'

type MenuAction = string

interface MenuItem {
  action: MenuAction
  title: string
  description: string
  buttonLabel: string
}

const props = defineProps<{
  items: MenuItem[]
}>()

const emit = defineEmits<{
  (e: 'command', payload: { action: MenuAction }): void
  (e: 'hover', payload: { action: MenuAction; hovering: boolean }): void
}>()

const currentIndex = ref(0)
const isAnimating = ref(false)
const transitionDirection = ref<'next' | 'prev' | null>(null)

const trackEl = ref<HTMLElement | null>(null)
const suppressClickUntil = ref(0)

const drag = ref({
  active: false,
  pointerId: -1,
  startX: 0,
  startY: 0,
  lastX: 0,
  moved: false,
})

const SWIPE_DISTANCE_PX = 45
const SWIPE_MAX_Y_PX = 80
const SWIPE_MAX_TIME_MS = 500
let swipeStartTime = 0

const visibleCards = computed(() => {
  const len = props.items.length
  if (!len) return []

  const current = currentIndex.value
  const prev = (current - 1 + len) % len
  const next = (current + 1) % len

  return [
    { role: 'prev' as const, card: props.items[prev] },
    { role: 'current' as const, card: props.items[current] },
    { role: 'next' as const, card: props.items[next] },
  ]
})

const trackClasses = computed(() => ({
  'menu-carousel__track--next': transitionDirection.value === 'next',
  'menu-carousel__track--prev': transitionDirection.value === 'prev',
}))

const TRANSITION_MS = 650
const INDEX_SWAP_MS = 40

function runTransition(direction: 'next' | 'prev', updateIndex: () => void) {
  if (!props.items.length || isAnimating.value) return

  isAnimating.value = true
  transitionDirection.value = direction

  window.setTimeout(() => updateIndex(), INDEX_SWAP_MS)

  window.setTimeout(() => {
    transitionDirection.value = null
    isAnimating.value = false
  }, TRANSITION_MS)
}

function next() {
  runTransition('next', () => {
    currentIndex.value = (currentIndex.value + 1) % props.items.length
  })
}

function prev() {
  runTransition('prev', () => {
    currentIndex.value = (currentIndex.value - 1 + props.items.length) % props.items.length
  })
}

function getCurrentAction(): MenuAction | null {
  if (!props.items.length) return null
  return props.items[currentIndex.value].action
}

function handleCardClick(action: MenuAction) {
  if (performance.now() < suppressClickUntil.value) return
  emit('command', { action })
}

function handleHover(action: MenuAction, hovering: boolean) {
  emit('hover', { action, hovering })
}

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  if (isAnimating.value) return
  const target = e.target as HTMLElement | null
  if (
    target?.closest?.(
      'button, a, input, textarea, select, [role="button"], [data-no-swipe="true"]'
    )
  ) {
    return
  }

  drag.value.active = true
  drag.value.pointerId = e.pointerId
  drag.value.startX = e.clientX
  drag.value.startY = e.clientY
  drag.value.lastX = e.clientX
  drag.value.moved = false
  swipeStartTime = performance.now()

  trackEl.value?.setPointerCapture?.(e.pointerId)
}


function onPointerMove(e: PointerEvent) {
  if (!drag.value.active || e.pointerId !== drag.value.pointerId) return

  const dx = e.clientX - drag.value.startX
  const dy = e.clientY - drag.value.startY

  if (Math.abs(dy) > SWIPE_MAX_Y_PX && Math.abs(dy) > Math.abs(dx)) {
    drag.value.active = false
    try { trackEl.value?.releasePointerCapture?.(e.pointerId) } catch {}
    return
  }

  drag.value.lastX = e.clientX
  drag.value.moved = drag.value.moved || Math.abs(dx) > 6

  if (Math.abs(dx) > 10) e.preventDefault()
}

function finishSwipe(e: PointerEvent) {
  if (!drag.value.active || e.pointerId !== drag.value.pointerId) return

  const dt = performance.now() - swipeStartTime
  const dx = drag.value.lastX - drag.value.startX
  const dy = e.clientY - drag.value.startY
  const absDx = Math.abs(dx)

  drag.value.active = false
  try { trackEl.value?.releasePointerCapture?.(e.pointerId) } catch {}

  if (!drag.value.moved) return

  if (Math.abs(dy) > Math.abs(dx)) return

  const quick = dt <= SWIPE_MAX_TIME_MS
  const swipe = absDx >= SWIPE_DISTANCE_PX || (quick && absDx >= 30)

  if (!swipe) return

  suppressClickUntil.value = performance.now() + 350

  if (dx < 0) next()
  else prev()
}

function onPointerUp(e: PointerEvent) {
  finishSwipe(e)
}
function onPointerCancel(e: PointerEvent) {
  finishSwipe(e)
}

defineExpose({
  next,
  prev,
  getCurrentAction,
})
</script>

<template>
  <section class="menu-carousel" aria-label="Main menu carousel">
    <div
      ref="trackEl"
      class="menu-carousel__track"
      :class="trackClasses"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    >
      <CarouselCard
        v-for="slot in visibleCards"
        :key="slot.card.action"
        :role="slot.role"
        :title="slot.card.title"
        :description="slot.card.description"
        :button-label="slot.card.buttonLabel"
        @command="handleCardClick(slot.card.action)"
        @hover="handleHover(slot.card.action, $event)"
      />
    </div>

    <div class="menu-carousel__controls">
      <button
        type="button"
        class="menu-carousel__nav menu-carousel__nav--prev"
        @click="prev"
        aria-label="Previous menu item"
      >
        ‹
      </button>

      <button
        type="button"
        class="menu-carousel__nav menu-carousel__nav--next"
        @click="next"
        aria-label="Next menu item"
      >
        ›
      </button>
    </div>
  </section>
</template>

<style scoped>
.menu-carousel {
  position: relative;
  width: 100%;
  margin: 0 auto;

  height: clamp(260px, 46vh, 420px);

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: visible;
}

.menu-carousel__track {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: min(860px, 98vw);
  overflow: visible;

  touch-action: pan-y;
}

.menu-carousel__track--next :deep(.carousel-card),
.menu-carousel__track--prev :deep(.carousel-card) {
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

.menu-carousel__controls {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.menu-carousel__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: auto;
  z-index: 20;
  border: none;

  width: 80px;
  height: 80px;
  border-radius: 50%;

  font-size: 3rem;
  line-height: 1;
  color: #ffffff;

  background: rgba(20, 20, 40, 0.75);
  box-shadow:
    0 0 18px rgba(95, 62, 252, 0.7),
    0 0 35px rgba(95, 62, 252, 0.4);
  backdrop-filter: blur(6px);

  display: flex;
  align-items: center;
  justify-content: center;

  transition:
    opacity 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.menu-carousel__nav--prev {
  left: -370px;
  transform: translateY(-20%);
}

.menu-carousel__nav--next {
  right: -370px;
  transform: translateY(-20%);
}

@media (hover: hover) and (pointer: fine) {
  .menu-carousel__nav:hover {
    transform: translateY(-50%) scale(1.12);
  }
}
@media (max-width: 576px) {
  .menu-carousel {
    height: clamp(360px, 62vh, 600px);
  }
}

@media (max-width: 576px) {
  .menu-carousel__track {
    max-width: 100vw;
  }
  .menu-carousel__nav--prev {
    left: calc(50% - min(260px, 46vw) - 12px);
  }
  .menu-carousel__nav--next {
    left: calc(50% + min(260px, 46vw) + 12px);
  }
}
@media (hover: none) and (pointer: coarse) {
  .menu-carousel__controls {
    display: none !important;
  }
}

</style>
