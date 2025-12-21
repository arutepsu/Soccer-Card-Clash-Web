// frontend/src/composables/useGameRouting.ts
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppServices } from '@/app/appServices';

const GAMEPLAY_ROUTES = new Set(['PlayingField', 'AttackerHand', 'AttackerDefenders']);
const ONLINE_ONLY_ROUTES = new Set(['SessionView']); // only this forces online

function keyOf(name: unknown): string {
  return typeof name === 'string' ? name : '';
}

export function useGameRouting() {
  const route = useRoute();
  const services = useAppServices();

  watch(
    () => route.name,
    async (name) => {
      const key = keyOf(name);

      // leaving gameplay / session → stop streaming
      if (key === 'Login' || key === 'MainMenu') {
        services.gameContext.stop();
        services.gameContext.clear();
        return;
      }

      // SessionView ALWAYS online
      if (ONLINE_ONLY_ROUTES.has(key)) {
        await services.gameContext.start('online');
        return;
      }

      // Gameplay routes use CURRENT mode (sticky)
      if (GAMEPLAY_ROUTES.has(key)) {
        const current = services.gameContext.mode.value;
        // default to local if unknown
        await services.gameContext.start(current ?? 'local');
        return;
      }

      // Everything else defaults to local menus / flows
      await services.gameContext.start('local');
    },
    { immediate: true },
  );
}
