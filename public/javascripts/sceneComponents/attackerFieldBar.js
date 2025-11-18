export function createAttackerFieldBar(getCurrentAttacker, getGameState, fieldRenderer) {
  let $root = null;
  let mounted = false;
  let selected = null;
  let lastAttackerName = null;

  const cssSelect = ($el) => $el.addClass('is-selected');
  const cssUnselectAll = () => {
    if (!$root) return;
    $root.find('.field-card.is-selected').removeClass('is-selected');
  };

  const canPick = ($el) => !$el.hasClass('is-defeated');

  function render() {
    if (!$root) return;
    $root.empty();

    const attackerPlayer = typeof getCurrentAttacker === 'function'
      ? getCurrentAttacker()
      : { id: 'att', name: getGameState()?.roles?.attacker };

    const attName = attackerPlayer?.name ?? null;
    if (attName !== lastAttackerName) {
      lastAttackerName = attName;
      selected = null;
    }

    const defRow = $(fieldRenderer.createDefenderRow(attackerPlayer, getGameState));
    const gkRow  = $(fieldRenderer.createGoalkeeperRow(attackerPlayer, getGameState));

    // --- Verteidiger-Karten ---
    defRow.find('.field-card').each(function() {
      const $card = $(this);
      $card.on('click', function() {
        if (!canPick($card)) return;
        const idx = Number($card.data('index'));
        selected = { kind: 'defender', index: idx };
        cssUnselectAll();
        cssSelect($card);
      });
    });

    // --- Torwart-Karte ---
    const $gkEl = gkRow.find('.field-card.goalkeeper');
    if ($gkEl.length) {
      $gkEl.on('click', function() {
        if (!canPick($gkEl)) return;
        selected = { kind: 'goalkeeper' };
        cssUnselectAll();
        cssSelect($gkEl);
      });
    }

    if (selected?.kind === 'defender') {
      const $el = defRow.find(`.field-card[data-index="${selected.index}"]`);
      if ($el.length && canPick($el)) cssSelect($el); else selected = null;
    } else if (selected?.kind === 'goalkeeper') {
      if ($gkEl.length && canPick($gkEl)) cssSelect($gkEl); else selected = null;
    }

    $root.append(defRow, gkRow);
  }

  return {
    mount(container) {
      if (mounted) return;
      $root = $('<div class="attacker-field-bar"></div>');
      $(container).append($root);
      mounted = true;
      render();
    },
    isMounted: () => mounted,
    updateBar: () => render(),
    selectedTarget: () => selected,
    clearSelection() {
      selected = null;
      cssUnselectAll();
    }
  };
}
