// frontend/src/composables/useOverlay.ts
import { useOverlayStore } from '../stores/overlayStore';

export interface OverlayShowOptions {
  title?: string;
  message?: string | null;
  content?: any;
  autoHide?: boolean;
  sizeMult?: number;
  onHide?: () => void;
  componentProps?: Record<string, unknown> | null;
}

export function useOverlay() {
  const store = useOverlayStore();

  function show(opts: OverlayShowOptions) {
    store.show({
      title: opts.title,
      message: opts.message ?? null,
      content: opts.content ?? null,
      componentProps: opts.componentProps ?? null,
      autoHide: opts.autoHide,
      sizeMult: opts.sizeMult,
      onHide: opts.onHide,
    });
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
