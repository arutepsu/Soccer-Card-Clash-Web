// frontend/src/composables/useGameRouting.ts
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppServices } from '@/app/appServices';

const GAMEPLAY_ROUTES = new Set(['PlayingField', 'AttackerHand', 'AttackerDefenders']);
const ONLINE_ONLY_ROUTES = new Set(['SessionView']);
const STOP_ROUTES = new Set(['Login', 'MainMenu']);

function keyOf(name: unknown): string {
  return typeof name === 'string' ? name : '';
}

export function useGameRouting() {
  const route = useRoute();
  const router = useRouter();
  const services = useAppServices();

  watch(
    () => route.name,
    async (name) => {
      const key = keyOf(name);

      if (STOP_ROUTES.has(key)) {
        services.gameContext.stop();
        services.gameContext.clear();
        return;
      }

      if (ONLINE_ONLY_ROUTES.has(key)) {
        if (services.gameContext.mode.value !== 'online') {
          services.gameContext.setMode('online');
        }
        services.gameContext.stop();
        return;
      }

      if (GAMEPLAY_ROUTES.has(key)) {
        const current = services.gameContext.mode.value;

        if (!current) {
          await router.replace({ name: 'MainMenu' });
          return;
        }

        await services.gameContext.start(current);
        return;
      }

    },
    { immediate: true },
  );
}
