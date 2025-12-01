export function createGameApi({ streamClient } = {}) {

  const csrf =
    document.querySelector('meta[name="csrf-token"]')?.content ||
    document.querySelector('input[name="csrfToken"]')?.value ||
    null;

  const commonHeaders = {
    'Content-Type': 'application/json',
    ...(csrf ? { 'Csrf-Token': csrf } : { 'Csrf-Token': 'nocheck' }),
  };

  async function postJSON(url, payload = {}) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: commonHeaders,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${url} failed: ${res.status} — ${text}`);
    }

    const txt = await res.text().catch(() => '');
    if (!txt) return null;
    try {
      return JSON.parse(txt);
    } catch {
      return txt;
    }
  }

  async function getJSON(url) {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: commonHeaders,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${url} failed: ${res.status} — ${text}`);
    }

    return res.json();
  }

  function openStream(onState) {
    if (streamClient && typeof streamClient.open === 'function') {
      return streamClient.open(onState);
    }

    console.warn('[GameApi] streamClient is not provided, streaming disabled');
    return {
      type: 'none',
      close() {},
    };
  }

  function fetchGameState() {
    return getJSON('/api/state');
  }

  function restart(attackerName, defenderName) {
    const body = {};
    if (attackerName) body.attackerName = attackerName;
    if (defenderName) body.defenderName = defenderName;
    return postJSON('/api/restart', body);
  }

  function singleAttackDefender(index) {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`singleAttackDefender: invalid index ${index}`));
    }
    return postJSON('/api/attack/single', { target: 'defender', index: idx });
  }

  function singleAttackGoalkeeper() {
    return postJSON('/api/attack/single', { target: 'goalkeeper' });
  }

  function doubleAttack(index) {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`doubleAttack: invalid index ${index}`));
    }
    return postJSON('/api/attack/double', { index: idx });
  }

  function boost(payload) {
    if (!payload || typeof payload !== 'object') {
      return Promise.reject(new Error('boost: missing payload'));
    }

    if (payload.target === 'defender') {
      const idx = Number(payload.index);
      if (!Number.isInteger(idx)) {
        return Promise.reject(new Error(`boost: invalid defender index ${payload.index}`));
      }
    }

    return postJSON('/api/boost', payload);
  }

  function swap(index) {
    const idx = Number(index);
    if (!Number.isInteger(idx)) {
      return Promise.reject(new Error(`swap: invalid index ${index}`));
    }
    return postJSON('/api/swap', { index: idx });
  }

  function reverseSwap() {
    return postJSON('/api/swap/reverse', {});
  }

  function undo() {
    return postJSON('/api/undo', {});
  }

  function redo() {
    return postJSON('/api/redo', {});
  }

  function executeAI(action) {
    return postJSON('/api/ai/execute', action);
  }

  return {
    postJSON,
    getJSON,
    openStream,
    fetchGameState,
    restart,
    singleAttackDefender,
    singleAttackGoalkeeper,
    doubleAttack,
    boost,
    swap,
    reverseSwap,
    undo,
    redo,
    executeAI,
  };
}
