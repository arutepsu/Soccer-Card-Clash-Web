function resolveState(getOrState) {
  return typeof getOrState === 'function' ? getOrState() : getOrState;
}

function handsOf(gs, pid) {
  const fromHands = gs?.cards?.hands?.[pid] ?? gs?.gameCards?.hands?.[pid];
  if (fromHands) return fromHands;
  if (pid === 'att') return gs?.cards?.attackerHand ?? [];
  if (pid === 'def') return gs?.cards?.defenderHand ?? [];
  return [];
}

function handSig(gs, pid) {
  if (pid === 'att') return (gs?.cards?.attackerHand ?? []).map(c => c?.fileName ?? '').join('|');
  if (pid === 'def') return (gs?.cards?.defenderHand ?? []).map(c => c?.fileName ?? '').join('|');
  return '';
}

export function createPlayersHandBar(player, initialGameState, renderer) {
  let root;
  let currentRow;
  let getState = (typeof initialGameState === 'function') ? initialGameState : () => initialGameState;
  let prevSig = null;

  function afterRowInserted(row) {
    try {
      const gs = resolveState(getState);
      const size = handsOf(gs, player.id).length;
      renderer.applyOverlapSpacing(row, size);
      prevSig = handSig(gs, player.id);
    } catch { /* no-op */ }

    [...row.children].forEach(node => {
      node.style.opacity = '0';
      requestAnimationFrame(() => {
        node.style.transition = 'opacity 500ms ease';
        node.style.opacity = '1';
      });
    });
  }

  function mount(el) {
    root = el;
    currentRow = renderer.createHandCardRow(player, getState);
    root.replaceChildren(currentRow);
    if (player?.id === 'att') root.classList.add('attacker-hand-bar');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', `${player?.id === 'att' ? 'Attacker' : 'Defender'} hand`);
    afterRowInserted(currentRow);
  }

  function updateBar(newGameState) {
    getState = (typeof newGameState === 'function') ? newGameState : () => newGameState;

    const gs = resolveState(getState);
    const next = handSig(gs, player.id);
    if (prevSig === next) return;

    [...(currentRow?.children ?? [])].forEach(node => {
      node.animate(
        [
          { transform: 'translateX(0) scale(1) rotate(0deg)' },
          { transform: 'translateX(25px) scale(1.1) rotate(8deg)' }
        ],
        { duration: 500, easing: 'cubic-bezier(.25,.8,.25,1)' }
      );
    });

    setTimeout(() => {
      const newRow = renderer.createHandCardRow(player, getState);
      root.replaceChildren(newRow);
      currentRow = newRow;
      afterRowInserted(newRow);
    }, 500);
  }

  function selectedCardIndex() { return null; }
  return { mount, updateBar, selectedCardIndex };
}
