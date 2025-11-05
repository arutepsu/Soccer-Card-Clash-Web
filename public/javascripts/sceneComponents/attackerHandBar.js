// sceneComponents/attackerHandBar.js
export function createAttackerHandBar(getCurrentAttacker, getGameState, handRenderer) {
  let root = null;
  let mounted = false;
  let selectedIndex = -1;
  let lastAttackerName = null;

  const safeState = () => (typeof getGameState === 'function' ? getGameState() : null);

  const handsOf = (gs, pid) =>
    gs?.cards?.hands?.[pid] ??
    gs?.gameCards?.hands?.[pid] ??
    [];

  const clearCssSelection = (row) => {
    if (!row) return;
    row.querySelectorAll('.hand-card.is-selected')
       .forEach(el => el.classList.remove('is-selected'));
  };

  const currentAttacker = () => {
    const att = (typeof getCurrentAttacker === 'function') ? getCurrentAttacker() : null;
    if (att) return att;
    const st = safeState();
    return { id: 'att', name: (st?.roles?.attacker || 'Attacker') };
  };

  function createSelectableHandCard({ card, index, isLast, onSelected }) {
    const el = document.createElement('div');
    el.className = 'hand-card game-card';
    el.dataset.index = String(index);
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'option');

    const url = isLast
      ? (card?.imgFront || card?.img)
      : (card?.imgBack  || card?.img);

    if (url) {
      el.style.backgroundImage = `url("${url}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
    } else {
      el.textContent = isLast ? (card?.fileName ?? 'card') : '🂠';
    }

    el.addEventListener('click', () => onSelected(index));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelected(index); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); onSelected(Math.max(0, index - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); onSelected(Math.min(index + 1, (el.parentElement?.children.length ?? 1) - 1)); }
      if (e.key === 'Escape')     { e.preventDefault(); if (selectedIndex !== -1) onSelected(selectedIndex); }
    });

    return el;
  }

  function render() {
    if (!root) return;
    root.innerHTML = '';

    const gs = safeState();
    const attacker = currentAttacker();
    const attName = attacker?.name ?? null;

    if (attName !== lastAttackerName) {
      lastAttackerName = attName;
      selectedIndex = -1;
    }

    const list = handsOf(gs, attacker.id);

    const row = document.createElement('div');
    row.className = 'hand-row hand-row-inner';
    row.setAttribute('role', 'listbox');
    row.setAttribute('aria-label', `${attName ?? 'Attacker'} hand`);

    const onSelected = (next) => {
      selectedIndex = (selectedIndex === next) ? -1 : next;
      clearCssSelection(row);
      row.querySelectorAll('.hand-card').forEach((el, i) => {
        const isSel = i === selectedIndex;
        el.classList.toggle('is-selected', isSel);
        el.setAttribute('aria-selected', String(isSel));
        if (isSel) el.focus();
      });
    };

    list.forEach((card, index) => {
      const isLast = index === list.length - 1;
      const el = createSelectableHandCard({ card, index, isLast, onSelected });
      el.setAttribute('aria-selected', String(selectedIndex === index));
      row.appendChild(el);
    });

    root.appendChild(row);
    handRenderer?.applyOverlapSpacing?.(row, list.length);

    if (selectedIndex >= 0 && selectedIndex < list.length) {
      const selEl = row.querySelector(`.hand-card[data-index="${selectedIndex}"]`) ||
                    row.children[selectedIndex];
      if (selEl) {
        selEl.classList.add('is-selected');
        selEl.setAttribute('aria-selected', 'true');
      }
    } else {
      selectedIndex = -1;
    }
  }

  return {
    mount(container) {
      if (mounted) return;
      root = document.createElement('div');
      root.className = 'attacker-hand-bar';
      container.appendChild(root);
      mounted = true;
      render();
    },
    isMounted: () => mounted,
    updateBar: () => render(),
    selectedHandIndex: () => selectedIndex,
    resetSelectedHand() {
      selectedIndex = -1;
      if (!root) return;
      root.querySelectorAll('.hand-card.is-selected')
          .forEach(el => el.classList.remove('is-selected'));
      root.querySelectorAll('.hand-card[aria-selected="true"]')
          .forEach(el => el.setAttribute('aria-selected', 'false'));
    },
    getSelectedCard() {
      const gs = safeState();
      const attacker = currentAttacker();
      const list = handsOf(gs, attacker.id);
      return (selectedIndex >= 0 && selectedIndex < list.length) ? list[selectedIndex] : null;
    }
  };
}
