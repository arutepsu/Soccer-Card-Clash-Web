// Wraps createDefaultFieldCardRenderer to add click selection.
export function createAttackerFieldBar(attackerPlayer, getGameState, fieldRenderer) {
  let root = null;
  let mounted = false;
  let selected = null;

  const cssSelect = (el) => el.classList.add('is-selected');
  const cssUnselectAll = () => {
    if (!root) return;
    root.querySelectorAll('.field-card.is-selected')
        .forEach(el => el.classList.remove('is-selected'));
  };

  const canPick = (el) => !el.classList.contains('is-defeated');

  function render() {
    if (!root) return;
    root.innerHTML = '';

    const defRow = fieldRenderer.createDefenderRow(attackerPlayer, getGameState);
    const gkRow  = fieldRenderer.createGoalkeeperRow(attackerPlayer, getGameState);

    defRow.querySelectorAll('.field-card').forEach(card => {
      card.addEventListener('click', () => {
        if (!canPick(card)) return;
        const idx = Number(card.dataset.index);
        selected = { kind: 'defender', index: idx };
        cssUnselectAll();
        cssSelect(card);
      });
    });

    const gkEl = gkRow.querySelector('.field-card.goalkeeper');
    if (gkEl) {
      gkEl.addEventListener('click', () => {
        if (!canPick(gkEl)) return;
        selected = { kind: 'goalkeeper' };
        cssUnselectAll();
        cssSelect(gkEl);
      });
    }

    if (selected?.kind === 'defender') {
      const el = defRow.querySelector(`.field-card[data-index="${selected.index}"]`);
      if (el && canPick(el)) cssSelect(el); else selected = null;
    } else if (selected?.kind === 'goalkeeper') {
      if (gkEl && canPick(gkEl)) cssSelect(gkEl); else selected = null;
    }

    root.appendChild(defRow);
    root.appendChild(gkRow);
  }

  return {
    mount(container) {
      if (mounted) return;
      root = document.createElement('div');
      root.className = 'attacker-field-bar';
      container.appendChild(root);
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
