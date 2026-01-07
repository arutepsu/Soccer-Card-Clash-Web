// frontend/src/stores/overlayStore.ts
import { shallowRef, ref } from 'vue'

export type OverlayContentComponent = any

const visible = ref(false)
const isClosing = ref(false)
const title = ref<string>('')
const message = ref<string | null>(null)
const content = shallowRef<OverlayContentComponent | null>(null)
const componentProps = shallowRef<Record<string, any> | null>(null)

const OVERLAY_ANIM_MS = 500

export interface OverlayStateOptions {
  title?: string
  message?: string | null
  content?: OverlayContentComponent | null
  componentProps?: Record<string, any> | null
  autoHide?: boolean
  sizeMult?: number
  onHide?: () => void
  durationMs?: number
}

export function useOverlayStore() {
  let pendingResolve: (() => void) | null = null

  function show(opts: OverlayStateOptions = {}) {
    title.value = opts.title ?? ''
    message.value = opts.message ?? null
    content.value = opts.content ?? null
    componentProps.value = opts.componentProps ?? null

    isClosing.value = false
    visible.value = true

    if (opts.autoHide) {
      const ms = Number.isFinite(opts.durationMs) ? (opts.durationMs as number) : 3000
      window.setTimeout(() => hide(), ms)
    }
  }

  function hide() {
    if (!visible.value || isClosing.value) return

    isClosing.value = true
    window.setTimeout(() => {
      visible.value = false
      isClosing.value = false
      content.value = null
      componentProps.value = null

      const r = pendingResolve
      pendingResolve = null
      try { r?.() } catch {}
    }, OVERLAY_ANIM_MS)
  }

  function showAndWait(opts: OverlayStateOptions = {}): Promise<void> {
    if (pendingResolve) {
      try { pendingResolve() } catch {}
      pendingResolve = null
    }

    show(opts)

    return new Promise<void>((resolve) => {
      pendingResolve = resolve
    })
  }

  return {
    visible,
    isClosing,
    title,
    message,
    content,
    componentProps,
    show,
    hide,
    showAndWait,
  }
}
