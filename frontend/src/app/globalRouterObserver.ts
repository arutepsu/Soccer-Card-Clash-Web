// frontend/src/app/globalRouterObserver.ts
import type { Router } from 'vue-router';
import { GlobalObservable, type GlobalObserver } from '../core/Observable';
import { SceneSwitchEvent, type SceneId } from '../scenes/registry';

function isSceneId(value: unknown): value is SceneId {
  return (
    typeof value === 'string' &&
    (Object.values(SceneSwitchEvent) as string[]).includes(value)
  );
}

/**
 * Connects GlobalObservable to Vue Router.
 *
 * Anywhere in the legacy code still do:
 *   GlobalObservable.notify(SceneSwitchEvent.PlayingField)
 *
 * this observer will catch the event and navigate to the route
 * with the same name (see router.ts).
 */
export function setupGlobalRouterObserver(router: Router): void {
  const observer: GlobalObserver = {
    async update(ev: unknown): Promise<void> {
      if (isSceneId(ev)) {
        try {
          await router.push({ name: ev });
        } catch (err) {
          console.error('[globalRouterObserver] router.push failed:', err);
        }
      }
    },
  };

  GlobalObservable.add(observer);
}
