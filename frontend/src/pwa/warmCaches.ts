export async function warmCache(urls: string[], opts?: { concurrency?: number }) {
  const uniq = Array.from(new Set(urls.filter(Boolean)));

  if (!navigator.onLine) return;

  const concurrency = opts?.concurrency ?? 8;
  let i = 0;

  async function worker() {
    while (i < uniq.length) {
      const idx = i++;
      const url = uniq[idx];

      try {
        await fetch(url, { cache: 'reload', credentials: 'same-origin' });
      } catch (e) {
        console.warn('[warmCache] failed', url, e);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log('[warmCache] done', uniq.length);
}
