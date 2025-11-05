// /assets/javascripts/scenes/scene.attackerHand.js
export async function build({ api, overlay, createGameAlert }) {
  const root = document.querySelector('.scene--attackerhand');
  if (!root) return { destroy() {}, refresh: async () => {} };

  let host = root.querySelector('#attacker-hand-root');
  if (!host) {
    host = document.createElement('div');
    host.id = 'attacker-hand-root';
    host.className = 'hand-row';
    root.appendChild(host);
  }

  const base = '/assets/images/cards/';

  function showAlert(msg) {
    if (overlay && createGameAlert) {
      const el = createGameAlert({ message: msg });
      overlay.show(el, { onHide: () => el.cleanup?.() });
    } else alert(msg);
  }

  function renderHand(hand = []) {
    host.innerHTML = '';
    if (!hand.length) {
      const p = document.createElement('p');
      p.className = 'empty-note';
      p.textContent = 'No cards in hand.';
      host.appendChild(p);
      return;
    }

    const row = document.createElement('div');
    row.className = 'hand-row-inner';

    hand.forEach((c, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'hand-card';

      const img = document.createElement('img');
      img.alt = c?.fileName ?? `Card ${i+1}`;
      img.src = c?.fileName ? `${base}${c.fileName}.png` : `${base}flippedCard.png`;
      img.decoding = 'async';
      img.loading = 'lazy';

      wrap.appendChild(img);
      row.appendChild(wrap);
    });

    host.appendChild(row);
  }

  async function fetchAndRender() {
    try {
      const st = await api.fetchGameState();
      renderHand(st?.cards?.attackerHand ?? []);
    } catch (e) {
      console.error(e);
      showAlert('Failed to load the attacker’s hand.');
      renderHand([]);
    }
  }

  await fetchAndRender();

  return {
    destroy() { host.innerHTML = ''; },
    refresh: fetchAndRender,
  };
}
