export function createPlayersFieldBar(player, getGameState, renderer) {
  let $root;
  let $defenderRow = null, $goalieRow = null;

  let selectedIndex = null;
  let goalkeeperSelected = false;

  let prevSig = null;

  function fieldSig(gs, pid) {
    const def = (pid === 'att' ? gs?.cards?.attackerField : gs?.cards?.defenderField) ?? [];
    const gk  = (pid === 'att' ? gs?.cards?.attackerGoalkeeper : gs?.cards?.defenderGoalkeeper) ?? null;

    const three = [...def].slice(0,3);
    while (three.length < 3) three.push({ card: null });

    const defPart = three.map(s => s?.card?.fileName ?? '').join('|');
    const gkPart  = gk?.fileName ?? '';
    return `${defPart}#${gkPart}`;
  }

  function labelElement(name) {
    return $('<div>').addClass('player-label').text(`${name}'s Field`);
  }

  function setSelection(index) {
    if (selectedIndex === index) {
      selectedIndex = null;
      goalkeeperSelected = false;
    } else {
      selectedIndex = index;
      goalkeeperSelected = (index === -1);
    }
    applySelectionClasses($defenderRow, false);
    applySelectionClasses($goalieRow, true);
  }

  function selectionOpts() {
    return {
      selectedIndex,
      onSelect: (idx) => setSelection(idx),
      selectable: true,
      isGoalkeeperSelected: goalkeeperSelected
    };
  }

  function buildDefenderRow(gs) {
    if (renderer.createDefenderRow.length >= 3) {
      return $(renderer.createDefenderRow(player, () => gs, selectionOpts()));
    }
    const row = $(renderer.createDefenderRow(player, () => gs));
    wireSelectable(row, false);
    applySelectionClasses(row, false);
    return row;
  }

  function buildGoalkeeperRow(gs) {
    if (renderer.createGoalkeeperRow.length >= 3) {
      return $(renderer.createGoalkeeperRow(player, () => gs, selectionOpts()));
    }
    const row = $(renderer.createGoalkeeperRow(player, () => gs));
    wireSelectable(row, true);
    applySelectionClasses(row, true);
    return row;
  }

  function wireSelectable($row, isGKRow) {
    if (!$row || $row.length === 0) return;

    $row.find('[data-index]').each(function () {
      const $el = $(this);
      const idx = Number($el.attr('data-index'));
      if (Number.isNaN(idx)) return;
      $el.css('cursor', 'pointer');
      $el.replaceWith($el.clone(false));
    });

    $row.find('[data-index]').each(function () {
      const $el = $(this);
      const idx = Number($el.attr('data-index'));
      if (Number.isNaN(idx)) return;
      $el.on('click', () => setSelection(idx));
      $el.on('keydown', (e) => {
        const key = e.key || e.originalEvent && e.originalEvent.key;
        if (key === 'Enter' || key === ' ') { e.preventDefault(); setSelection(idx); }
      });
      $el.attr('role', 'button');
      $el.attr('tabindex', '0');
      $el.attr('aria-pressed', String(selectedIndex === idx));
    });
  }

  function applySelectionClasses($row, isGKRow) {
    if (!$row || $row.length === 0) return;
    $row.find('[data-index]').each(function () {
      const $el = $(this);
      const idx = Number($el.attr('data-index'));
      if (Number.isNaN(idx)) return;
      if (selectedIndex === idx) {
        $el.addClass('is-selected');
        $el.attr('aria-pressed', 'true');
      } else {
        $el.removeClass('is-selected');
        $el.attr('aria-pressed', 'false');
      }
    });
  }

  function updateRows(gameState) {
    const $newDef = buildDefenderRow(gameState);
    const $newGk  = buildGoalkeeperRow(gameState);

    const $label = $root.find('.player-label');
    if ($label.length === 0) {
      $root.empty().append(labelElement(player.name), $newDef, $newGk);
    } else {
      $root.empty().append($label.length ? $label : labelElement(player.name), $newDef, $newGk);
    }

    $defenderRow = $newDef;
    $goalieRow   = $newGk;

    applySelectionClasses($defenderRow, false);
    applySelectionClasses($goalieRow, true);
  }

  function mount(el) {
    $root = $(el);
    $root.addClass('players-field-bar');
    const gs = getGameState();
    $defenderRow = buildDefenderRow(gs);
    $goalieRow   = buildGoalkeeperRow(gs);
    $root.empty().append(labelElement(player.name), $defenderRow, $goalieRow);
    prevSig = fieldSig(gs, player.id);
  }

  function updateBar(gameState) {
    const next = fieldSig(gameState, player.id);
    if (prevSig === next) {
      applySelectionClasses($defenderRow, false);
      applySelectionClasses($goalieRow, true);
      return;
    }
    prevSig = next;
    updateRows(gameState);
  }

  function selectedDefenderIndex() { return selectedIndex; }
  function isGoalkeeperSelected() { return goalkeeperSelected; }
  function resetSelectedDefender() {
    selectedIndex = null;
    goalkeeperSelected = false;
    applySelectionClasses($defenderRow, false);
    applySelectionClasses($goalieRow, true);
  }

  return { mount, updateBar, selectedDefenderIndex, isGoalkeeperSelected, resetSelectedDefender };
}
