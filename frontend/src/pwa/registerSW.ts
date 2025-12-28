export function registerServiceWorker(opts?: {
  onUpdateReady?: () => void;
}) {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/web/service-worker.js');

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
  });
}
