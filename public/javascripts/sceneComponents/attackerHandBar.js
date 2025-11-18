export function createAttackerHandBar(getCurrentAttacker, getGameState, handRenderer) {
  let $root = null;
  let mounted = false;
  let selectedIndex = -1;
  let lastAttackerName = null;

  const safeState = () =>
    (typeof getGameState === 'function' ? getGameState() : null);

  const handsOf = (gs, pid) =>
    gs?.cards?.hands?.[pid] ??
    gs?.gameCards?.hands?.[pid] ??
    [];

  const clearCssSelection = ($row) => {
    if (!$row) return;
    $row.find('.hand-card.is-selected').removeClass('is-selected').attr('aria-selected', 'false');
  };

  const currentAttacker = () => {
    const att = (typeof getCurrentAttacker === 'function') ? getCurrentAttacker() : null;
    if (att) return att;
    const st = safeState();
    return { id: 'att', name: (st?.roles?.attacker || 'Attacker') };
  };

  function createSelectableHandCard({ card, index, isLast, onSelected }) {
    const $el = $('<div></div>')
      .addClass('hand-card game-card')
      .attr({
        'data-index': index,
        'tabindex': 0,
        'role': 'option',
      });

    const url = isLast
      ? (card?.imgFront || card?.img)
      : (card?.imgBack || card?.img);

    if (url) {
      $el.css({
        'background-image': `url("${url}")`,
        'background-size': 'cover',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
      });
    } else {
      $el.text(isLast ? (card?.fileName ?? 'card') : '🂠');
    }

    // Klick + Tastatursteuerung
    $el.on('click', () => onSelected(index));
    $el.on('keydown', (e) => {
      if (['Enter', ' '].includes(e.key)) { e.preventDefault(); onSelected(index); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); onSelected(Math.max(0, index - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); onSelected(Math.min(index + 1, ($el.parent().children().length ?? 1) - 1)); }
      if (e.key === 'Escape')     { e.preventDefault(); if (selectedIndex !== -1) onSelected(selectedIndex); }
    });

    return $el;
  }

  function render() {
    if (!$root) return;
    $root.empty();

    const gs = safeState();
    const attacker = currentAttacker();
    const attName = attacker?.name ?? null;

    if (attName !== lastAttackerName) {
      lastAttackerName = attName;
      selectedIndex = -1;
    }

    const list = handsOf(gs, attacker.id);

    const $row = $('<div></div>')
      .addClass('hand-row hand-row-inner')
      .attr({
        'role': 'listbox',
        'aria-label': `${attName ?? 'Attacker'} hand`
      });

    const onSelected = (next) => {
      selectedIndex = (selectedIndex === next) ? -1 : next;
      clearCssSelection($row);

      $row.find('.hand-card').each(function(i) {
        const $card = $(this);
        const isSel = i === selectedIndex;
        $card.toggleClass('is-selected', isSel);
        $card.attr('aria-selected', String(isSel));
        if (isSel) $card.focus();
      });
    };

    list.forEach((card, index) => {
      const isLast = index === list.length - 1;
      const $el = createSelectableHandCard({ card, index, isLast, onSelected });
      $el.attr('aria-selected', String(selectedIndex === index));
      $row.append($el);
    });

    $root.append($row);
    handRenderer?.applyOverlapSpacing?.($row[0], list.length);

    if (selectedIndex >= 0 && selectedIndex < list.length) {
      const $selEl = $row.find(`.hand-card[data-index="${selectedIndex}"]`);
      if ($selEl.length) {
        $selEl.addClass('is-selected').attr('aria-selected', 'true');
      }
    } else {
      selectedIndex = -1;
    }
  }

  return {
    mount(container) {
      if (mounted) return;
      $root = $('<div class="attacker-hand-bar"></div>');
      $(container).append($root);
      mounted = true;
      render();
    },
    isMounted: () => mounted,
    updateBar: () => render(),
    selectedHandIndex: () => selectedIndex,
    resetSelectedHand() {
      selectedIndex = -1;
      if (!$root) return;
      $root.find('.hand-card.is-selected')
        .removeClass('is-selected')
        .attr('aria-selected', 'false');
    },
    getSelectedCard() {
      const gs = safeState();
      const attacker = currentAttacker();
      const list = handsOf(gs, attacker.id);
      return (selectedIndex >= 0 && selectedIndex < list.length)
        ? list[selectedIndex]
        : null;
    }
  };
}
