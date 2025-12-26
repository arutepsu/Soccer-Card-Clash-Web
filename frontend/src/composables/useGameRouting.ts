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

function qstr(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : null;
}

export function useGameRouting() {
  const route = useRoute();
  const router = useRouter();
  const services = useAppServices();

  watch(
    () => [route.name, route.query.mode, route.query.sid] as const,
    async ([name, qMode, qSid]) => {
      const key = keyOf(name);

      if (STOP_ROUTES.has(key)) {
        services.gameContext.stop();
        services.gameContext.clear();
        return;
      }

      if (ONLINE_ONLY_ROUTES.has(key)) {
        services.gameContext.stop();
        return;
      }

      if (!GAMEPLAY_ROUTES.has(key)) return;

      const modeFromUrl = qstr(qMode) as 'local' | 'online' | null;
      const sidFromUrl = qstr(qSid);

      if (modeFromUrl === 'online') {
        if (!sidFromUrl) {
          await router.replace({ name: 'MainMenu' });
          return;
        }
        services.gameContext.setMode('online');
        services.gameContext.setSessionId(sidFromUrl);
        await services.gameContext.start('online', sidFromUrl);
        return;
      }

      services.gameContext.setMode('local');
      await services.gameContext.start('local');
    },
    { immediate: true },
  );
}
