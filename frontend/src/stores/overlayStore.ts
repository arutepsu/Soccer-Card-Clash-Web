// frontend/src/stores/overlayStore.ts
import { shallowRef, ref } from 'vue';

export type OverlayContentComponent = any;

const visible = ref(false);
const isClosing = ref(false);          // ⭐ NEW
const title = ref<string>('');
const message = ref<string | null>(null);
const content = shallowRef<OverlayContentComponent | null>(null);
const componentProps = shallowRef<Record<string, any> | null>(null);

// keep this in sync with CSS transition duration
const OVERLAY_ANIM_MS = 500;

export interface OverlayStateOptions {
  title?: string;
  message?: string | null;
  content?: OverlayContentComponent | null;
  props?: Record<string, any> | null;
}

export function useOverlayStore() {
  function show(opts: OverlayStateOptions = {}) {
    title.value = opts.title ?? '';
    message.value = opts.message ?? null;
    content.value = opts.content ?? null;
    componentProps.value = opts.props ?? null;

    isClosing.value = false;          // reset closing state
    visible.value = true;
  }

  function hide() {
    // already hidden / closing → ignore
    if (!visible.value || isClosing.value) return;

    isClosing.value = true;

    // wait for CSS animation to finish, then unmount + cleanup
    window.setTimeout(() => {
      visible.value = false;
      isClosing.value = false;
      content.value = null;
      componentProps.value = null;
    }, OVERLAY_ANIM_MS);
  }

  return {
    visible,
    isClosing,                         // ⭐ expose
    title,
    message,
    content,
    componentProps,
    show,
    hide,
  };
}
