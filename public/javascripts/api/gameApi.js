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

  // optional helper for SSE consumers
  function openStream(onMessage) {
    const es = new EventSource('/api/stream', { withCredentials: true });
    es.onmessage = (e) => { if (onMessage) onMessage(JSON.parse(e.data)); };
    es.onerror = (e) => { /* you can log or reconnect here */ };
    return es;
  }

  return {
    // --- state ---
    fetchGameState: () => getJSON('/api/state'),
    openStream,

    // --- attacks ---
    singleAttackDefender(index) {
      const idx = Number(index);
      if (!Number.isInteger(idx)) return Promise.reject(new Error(`singleAttackDefender: invalid index ${index}`));
      // { target: 'defender', index }
      return postJSON('/api/attack/single', { target: 'defender', index: idx });
    },
    singleAttackGoalkeeper() {
      // { target: 'goalkeeper' }
      return postJSON('/api/attack/single', { target: 'goalkeeper' });
    },
    doubleAttack(index) {
      const idx = Number(index);
      if (!Number.isInteger(idx)) return Promise.reject(new Error(`doubleAttack: invalid index ${index}`));
      // { index }
      return postJSON('/api/attack/double', { index: idx });
    },

    // --- boost (unified endpoint) ---
    boost(payload) {
      // payload must be either:
      //   { target: 'defender', index: number }  or  { target: 'goalkeeper' }
      if (!payload || typeof payload !== 'object') {
        return Promise.reject(new Error('boost: missing payload'));
      }
      if (payload.target === 'defender') {
        const idx = Number(payload.index);
        if (!Number.isInteger(idx)) return Promise.reject(new Error(`boost: invalid defender index ${payload.index}`));
      }
      return postJSON('/api/boost', payload);
    },

    // --- swaps ---
    swap(index) {
      const idx = Number(index);
      if (!Number.isInteger(idx)) return Promise.reject(new Error(`swap: invalid index ${index}`));
      // { index }
      return postJSON('/api/swap', { index: idx });
    },
    reverseSwap: () => postJSON('/api/swap/reverse', {}),

    // --- undo / redo ---
    undo: () => postJSON('/api/undo', {}),
    redo: () => postJSON('/api/redo', {}),

    // --- AI ---
    // action must match your AIAction JSON format (with "type" discriminator)
    // e.g. { type: "SingleAttackAIAction", defenderIndex: 1 }
    //      { type: "BoostAIAction", cardIndex: 0, zone: "GoalkeeperZone" }
    executeAI: (action) => postJSON('/api/ai/execute', action),

    // expose helpers if needed elsewhere
    postJSON,
    getJSON,
  };
}
