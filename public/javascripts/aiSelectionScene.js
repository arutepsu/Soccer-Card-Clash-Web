export async function build({ api, overlay, createGameAlert }) {
  const $root = $('.scene--ai');
  if (!$root || $root.length === 0) return { destroy() {}, refresh: async () => {} };

  const $cards = $root.find('.card[data-ai]');
  const $startBtn = $root.find('#btn-start');

  let selectedAI = null;

  function selectCard($card) {
    $cards.removeClass('is-selected');
    $card.addClass('is-selected');
    selectedAI = $card.data('ai');
  }

  // attach handlers
  $cards.on('click.aiSelect', function () {
    selectCard($(this));
  });

  function showAlert(msg) {
    if (overlay && createGameAlert) {
      const el = createGameAlert({ message: msg });
      overlay.show(el, { onHide: () => el.cleanup?.() });
    } else alert(msg);
  }

  $startBtn.on('click.aiStart', async function () {
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
      $cards.off('.aiSelect');
      $startBtn.off('.aiStart');
    },
    refresh: async () => {}
  };
}
