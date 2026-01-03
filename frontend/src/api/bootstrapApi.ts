export async function ensureBackendSession(): Promise<void> {
  await fetch('/api/bootstrap', { method: 'GET', credentials: 'include' }).then(() => {});
}
