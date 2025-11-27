export async function build({ api, push, overlay, createGameAlert }) {
  const root = document.querySelector('.scene--ai');
  if (!root) return { destroy() {}, refresh: async () => {} };

  const cards    = Array.from(root.querySelectorAll('.card[data-ai]'));
  const startBtn = root.querySelector('#btn-start');

  let selectedAI = null;

  function selectCard(cardEl) {
    cards.forEach((c) => c.classList.remove('is-selected'));
    cardEl.classList.add('is-selected');
    selectedAI = cardEl.getAttribute('data-ai');
  }

  cards.forEach((card) => {
    card.addEventListener('click', onCardClick);
  });

  function onCardClick(e) {
    const card = e.currentTarget;
    selectCard(card);
  }

  function showAlert(msg) {
    if (overlay && createGameAlert) {
      const el = createGameAlert({ message: msg });
      overlay.show(el, { onHide: () => el.cleanup?.() });
    } else {
      alert(msg);
    }
  }

  function setBusy(busy) {
    const flag = !!busy;
    if (startBtn) {
      startBtn.disabled = flag;
      startBtn.classList.toggle('is-busy', flag);
    }
    cards.forEach((c) => { c.style.pointerEvents = flag ? 'none' : ''; });
  }

  function getHumanName() {
    try {
      const stored = sessionStorage.getItem('humanPlayerName');
      const trimmed = (stored || '').trim();
      return trimmed || 'Player';
    } catch {
      return 'Player';
    }
  }

  function formatAiName(aiKey) {
    if (!aiKey) return 'AI';
    return aiKey.charAt(0).toUpperCase() + aiKey.slice(1);
  }

  async function onStartClick(e) {
    e.preventDefault();

    if (!selectedAI) {
      showAlert('Please select an AI opponent first!');
      return;
    }

    const humanName    = getHumanName();
    const aiPlayerName = formatAiName(selectedAI);

    setBusy(true);

    try {
      if (push && typeof push.createGameWithAI === 'function') {
        push.createGameWithAI(humanName, aiPlayerName);
        window.location.href = '/playing-field';
        return;
      }

      if (api && typeof api.restart === 'function') {
        await api.restart(humanName, aiPlayerName);
        window.location.href = '/playing-field';
        return;
      }

      const res = await fetch('/start-singleplayer-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          humanPlayer: humanName,
          aiPlayer: aiPlayerName,
        }),
      });

      if (res.redirected) {
        window.location.href = res.url;
      } else {
        showAlert('Failed to start singleplayer game.');
        setBusy(false);
      }
    } catch (err) {
      console.error('[AISelection] Error starting game:', err);
      showAlert('Error starting the game.');
      setBusy(false);
    }
  }

  startBtn?.addEventListener('click', onStartClick);

  return {
    destroy() {
      cards.forEach((card) => {
        card.removeEventListener('click', onCardClick);
      });
      startBtn?.removeEventListener('click', onStartClick);
      setBusy(false);
    },
    refresh: async () => {},
  };
}
