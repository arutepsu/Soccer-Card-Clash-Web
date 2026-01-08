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
  durationMs?: number

  onHide?: () => void
}

export function useOverlayStore() {
  let pendingResolve: (() => void) | null = null
  let overlaySeq = 0
  let pendingOnHide: (() => void) | null = null

  function resolvePending() {
    const r = pendingResolve
    pendingResolve = null
    try { r?.() } catch {}
  }

  function runOnHideOnce() {
    const cb = pendingOnHide
    pendingOnHide = null
    try { cb?.() } catch {}
  }

  function show(opts: OverlayStateOptions = {}) {
    overlaySeq += 1
    const mySeq = overlaySeq

    resolvePending()
    pendingOnHide = opts.onHide ?? null

    title.value = opts.title ?? ''
    message.value = opts.message ?? null
    content.value = opts.content ?? null
    componentProps.value = opts.componentProps ?? null

    isClosing.value = false
    visible.value = true

    if (opts.autoHide) {
      const ms = Number.isFinite(opts.durationMs) ? (opts.durationMs as number) : 3000
      window.setTimeout(() => {
        if (mySeq === overlaySeq) hide()
      }, ms)
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

      runOnHideOnce()
      resolvePending()
    }, OVERLAY_ANIM_MS)
  }

  function showAndWait(opts: OverlayStateOptions = {}): Promise<void> {
    const merged: OverlayStateOptions = {
      autoHide: opts.autoHide ?? true,
      durationMs: opts.durationMs ?? 3000,
      ...opts,
    }

    show(merged)

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
