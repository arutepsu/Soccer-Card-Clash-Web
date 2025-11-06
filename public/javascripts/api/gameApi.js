// /assets/javascripts/api/gameApi.js
export function createGameApi() {
  const csrf =
    document.querySelector('meta[name="csrf-token"]')?.content ||
    document.querySelector('input[name="csrfToken"]')?.value;

  const commonHeaders = {
    'Content-Type': 'application/json',
    ...(csrf ? { 'Csrf-Token': csrf } : { 'Csrf-Token': 'nocheck' })
  };

  async function postJSON(url, payload = {}) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: commonHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`${url} failed: ${res.status} — ${await res.text()}`);
    }
    const txt = await res.text();
    try { return txt ? JSON.parse(txt) : null; } catch { return txt; }
  }

  async function getJSON(url) {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: commonHeaders,
    });
    if (!res.ok) throw new Error(`${url} failed: ${res.status} — ${await res.text()}`);
    return res.json();
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  function openStream(onMessage) {
    const es = new EventSource('/api/stream', { withCredentials: true });
    es.onmessage = (e) => { if (onMessage) onMessage(JSON.parse(e.data)); };
    es.onerror = (e) => { /* you can log or reconnect here */ };
    return es;
  }

  return {
    fetchGameState: () => getJSON('/api/state'),
    openStream,
    restart: async (attackerName, defenderName) => {
      const body = {};
      if (attackerName) body.attackerName = attackerName;
      if (defenderName) body.defenderName = defenderName;
      return postJSON(`/api/restart`, body);
    },

    singleAttackDefender(index) {
      const idx = Number(index);
      if (!Number.isInteger(idx)) return Promise.reject(new Error(`singleAttackDefender: invalid index ${index}`));
      return postJSON('/api/attack/single', { target: 'defender', index: idx });
    },
    singleAttackGoalkeeper() {
      return postJSON('/api/attack/single', { target: 'goalkeeper' });
    },
    doubleAttack(index) {
      const idx = Number(index);
      if (!Number.isInteger(idx)) return Promise.reject(new Error(`doubleAttack: invalid index ${index}`));
      return postJSON('/api/attack/double', { index: idx });
    },

    boost(payload) {

      if (!payload || typeof payload !== 'object') {
        return Promise.reject(new Error('boost: missing payload'));
      }
      if (payload.target === 'defender') {
        const idx = Number(payload.index);
        if (!Number.isInteger(idx)) return Promise.reject(new Error(`boost: invalid defender index ${payload.index}`));
      }
      return postJSON('/api/boost', payload);
    },

    swap(index) {
      const idx = Number(index);
      if (!Number.isInteger(idx)) return Promise.reject(new Error(`swap: invalid index ${index}`));
      return postJSON('/api/swap', { index: idx });
    },
    reverseSwap: () => postJSON('/api/swap/reverse', {}),
    undo: () => postJSON('/api/undo', {}),
    redo: () => postJSON('/api/redo', {}),

    executeAI: (action) => postJSON('/api/ai/execute', action),

    postJSON,
    getJSON,
  };
}
