export function registerServiceWorker(opts?: {
  onUpdateReady?: () => void;
  onRegistered?: () => void | Promise<void>;
}) {
  if (!('serviceWorker' in navigator)) return;

  (async () => {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      async function runRegisteredIfControlled() {
        if (navigator.serviceWorker.controller) {
          await opts?.onRegistered?.();
        }
      }

      await runRegisteredIfControlled();

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        runRegisteredIfControlled();
      });

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;

        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            opts?.onUpdateReady?.();
          }
        });
      });
    } catch (e) {
      console.warn('[PWA] SW registration failed', e);
    }
  })();
}
