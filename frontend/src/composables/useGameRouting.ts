// frontend/src/composables/useGameRouting.ts
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameContext } from './useGameContext';
import { useOverlayStore } from '@/stores/overlayStore';

export function useGameRouting() {
  const router = useRouter();
  const gameContext = useGameContext();
  const overlay = useOverlayStore();

  watch(
    () => gameContext.state.value,
    async (state) => {
      if (!state) return;
      if (!state.you) return;

      const currentName = router.currentRoute.value.name;
      if (currentName === 'Login') return;

      if (currentName === 'PlayingField') {
        overlay.hide();
        return;
      }

      try {
        await router.push({ name: 'PlayingField' });
      } finally {
        overlay.hide();
      }
    },
    { immediate: true },
  );
}
