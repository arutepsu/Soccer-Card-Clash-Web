// frontend/src/composables/useOverlay.ts
import { useOverlayStore } from '../stores/overlayStore';

export interface OverlayShowOptions {
  title?: string;
  message?: string | null;
  content?: any;
  props?: Record<string, any> | null;
}

export function useOverlay() {
  const store = useOverlayStore();

  function show(opts: OverlayShowOptions) {
    store.show(opts);
  }

  function hide() {
    store.hide();
  }

  return {
    overlayStore: store,
    show,
    hide,
  };
}
