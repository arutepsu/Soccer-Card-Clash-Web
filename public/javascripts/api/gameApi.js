// /assets/javascripts/api/gameApi.js
export function createGameApi() {
  const csrf =
    document.querySelector('meta[name="csrf-token"]')?.content ||
    document.querySelector('input[name="csrfToken"]')?.value;

  async function postJSON(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'Csrf-Token': csrf } : {})
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`${url} failed: ${res.status} — ${await res.text()}`);
    }
    return res.json();
  }

  return {
    singleAttack(defenderIndex) {
      const idx = Number(defenderIndex);
      if (!Number.isInteger(idx)) {
        return Promise.reject(new Error(`singleAttack: invalid index: ${defenderIndex}`));
      }
      return postJSON('/api/singleAttack', { target: 'defender', index: idx });
    },

    singleAttackGoalkeeper() {
      return postJSON('/api/singleAttack', { target: 'goalkeeper' });
    },
  };
}
