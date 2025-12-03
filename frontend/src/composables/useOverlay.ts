// frontend/src/composables/useOverlay.ts
import { computed } from 'vue';
import { useAppServices } from '../app/appServices';
import type { Overlay } from '../ui/overlay';

export function useOverlay(): {
  overlay: Overlay | null;
  hasOverlay: boolean;
  show: Overlay['show'] | null;
  hide: Overlay['hide'] | null;
} {
  const { overlay } = useAppServices();

  const hasOverlay = computed(() => overlay != null).value;

  return {
    overlay,
    hasOverlay,
    show: overlay?.show?.bind(overlay) ?? null,
    hide: overlay?.hide?.bind(overlay) ?? null,
  };
}
