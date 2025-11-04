export async function build({ api, overlay, createGameAlert }) {
  const root = document.querySelector('.scene--ai');
  if (!root) return { destroy() {}, refresh: async () => {} };

  const cards = Array.from(root.querySelectorAll('.card[data-ai]'));
  const startBtn = root.querySelector('#btn-start');

  let selectedAI = null;

  function selectCard(card) {
    cards.forEach(c => c.classList.remove('is-selected'));
    card.classList.add('is-selected');
    selectedAI = card.dataset.ai;
  }

  cards.forEach(card => {
    card.addEventListener('click', () => selectCard(card));
  });

  function showAlert(msg) {
    if (overlay && createGameAlert) {
      const el = createGameAlert({ message: msg });
      overlay.show(el, { onHide: () => el.cleanup?.() });
    } else alert(msg);
  }

  startBtn?.addEventListener('click', async () => {
    if (!selectedAI) {
      showAlert('Please select an AI opponent first!');
      return;
    }

    try {
      const res = await fetch('/start-singleplayer-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          humanPlayer: 'Player',
          aiPlayer: selectedAI.charAt(0).toUpperCase() + selectedAI.slice(1)
        })
      });

      if (res.redirected) {
        window.location.href = res.url;
      } else {
        showAlert('Failed to start singleplayer game.');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error starting the game.');
    }
  });

  return {
    destroy() {
      cards.forEach(c => c.removeEventListener('click', selectCard));
      startBtn?.removeEventListener('click', () => {});
    },
    refresh: async () => {}
  };
}
