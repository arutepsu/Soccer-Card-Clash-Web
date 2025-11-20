// /assets/javascripts/sceneComponents/attackerFieldBar.js
export function createAttackerFieldBar(getCurrentAttacker, getGameState, fieldRenderer) {
  /** @type {HTMLElement | null} */
  let root = null;
  let mounted = false;
  let selected = /** @type {{ kind: 'defender', index: number } | { kind: 'goalkeeper' } | null */ (null);
  let lastAttackerName = null;

  const cssSelect = (el) => el.classList.add('is-selected');

  const cssUnselectAll = () => {
    if (!root) return;
    root.querySelectorAll('.field-card.is-selected').forEach(card => {
      card.classList.remove('is-selected');
    });
  };

  const canPick = (el) => !el.classList.contains('is-defeated');

  const safeState = () =>
    (typeof getGameState === 'function' ? getGameState() : null);

  const currentAttacker = () => {
    if (typeof getCurrentAttacker === 'function') {
      const att = getCurrentAttacker();
      if (att) return att;
    }
    const st = safeState();
    return { id: 'att', name: st?.roles?.attacker };
  };

  function normalizeRow(row) {
    // fieldRenderer may return an HTMLElement or an HTML string
    if (!row) {
      return document.createElement('div');
    }
    if (row instanceof HTMLElement) {
      return row;
    }
    if (typeof row === 'string') {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = row.trim();
      return wrapper.firstElementChild || wrapper;
    }
    // Fallback
    return row;
  }

  function render() {
    if (!root) return;
    root.innerHTML = '';

    const attackerPlayer = currentAttacker();
    const attName = attackerPlayer?.name ?? null;

    if (attName !== lastAttackerName) {
      lastAttackerName = attName;
      selected = null;
    }

    const defRowRaw = fieldRenderer.createDefenderRow(attackerPlayer, getGameState);
    const gkRowRaw  = fieldRenderer.createGoalkeeperRow(attackerPlayer, getGameState);

    const defRow = normalizeRow(defRowRaw);
    const gkRow  = normalizeRow(gkRowRaw);

    // --- Defender cards ---
    defRow.querySelectorAll('.field-card').forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        if (!canPick(cardEl)) return;
        const idx = Number(cardEl.dataset.index);
        selected = { kind: 'defender', index: idx };
        cssUnselectAll();
        cssSelect(cardEl);
      });
    });

    // --- Goalkeeper card ---
    const gkEl = gkRow.querySelector('.field-card.goalkeeper');
    if (gkEl) {
      gkEl.addEventListener('click', () => {
        if (!canPick(gkEl)) return;
        selected = { kind: 'goalkeeper' };
        cssUnselectAll();
        cssSelect(gkEl);
      });
    }

    // Restore previous selection if still valid
    if (selected?.kind === 'defender') {
      const selEl = defRow.querySelector(`.field-card[data-index="${selected.index}"]`);
      if (selEl && canPick(selEl)) {
        cssSelect(selEl);
      } else {
        selected = null;
      }
    } else if (selected?.kind === 'goalkeeper') {
      if (gkEl && canPick(gkEl)) {
        cssSelect(gkEl);
      } else {
        selected = null;
      }
    }

    root.appendChild(defRow);
    root.appendChild(gkRow);
  }

  return {
    mount(container) {
      if (mounted) return;

      let parent;
      if (container instanceof HTMLElement) {
        parent = container;
      } else {
        parent = document.querySelector(container);
      }
      if (!parent) return;

      root = document.createElement('div');
      root.className = 'attacker-field-bar';
      parent.appendChild(root);

      mounted = true;
      render();
    },
    isMounted: () => mounted,
    updateBar: () => render(),
    selectedTarget: () => selected,
    clearSelection() {
      selected = null;
      cssUnselectAll();
    },
  };
}
