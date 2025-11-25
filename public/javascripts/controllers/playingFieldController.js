export function createPlayingFieldController({
  api,
  push,
  fieldRenderer,
  handRenderer,
  createPlayersFieldBar,
  createPlayersHandBar,
  elField,
  elHand,
  mapWebToScene,
  afterServerApply,
}) {
  let gameState = null;
  const getGS = () => gameState;
  let lastUsedDefenderIndex = null;

  let defenderFieldBar = null;
  let attackerHandBar  = null;
  let busy = false;

  function mapState(webOrMapped) {
    return mapWebToScene ? mapWebToScene(webOrMapped) : webOrMapped;
  }

  function applyWeb(web) {
    const mapped = mapState(web);
    gameState = mapped;
    refreshUI();
    return mapped;
  }

  function mountIfNeeded(st) {
    if (!defenderFieldBar && st?.players?.defender) {
      defenderFieldBar = createPlayersFieldBar(st.players.defender, getGS, fieldRenderer);
      defenderFieldBar.mount(elField);
    }
    if (!attackerHandBar && st?.players?.attacker) {
      attackerHandBar = createPlayersHandBar(st.players.attacker, getGS, handRenderer);
      attackerHandBar.mount(elHand);
    }
  }

  function refreshUI() {
    if (defenderFieldBar) defenderFieldBar.updateBar(gameState);
    if (attackerHandBar)  attackerHandBar.updateBar(gameState);
  }

  function buildSceneShim(web) {
    const attacker = { id: 'att', name: web.roles.attacker, playerType: 'Human' };
    const defender = { id: 'def', name: web.roles.defender, playerType: 'Human' };
    return { players: { attacker, defender } };
  }

  async function onSingleAttackDefender() {
    if (busy || !defenderFieldBar) return;

    const idx = defenderFieldBar.selectedDefenderIndex?.();
    if (idx == null) return;

    lastUsedDefenderIndex = idx;

    try {
      busy = true;

      if (push && typeof push.regularAttack === 'function') {
        push.regularAttack('defender', idx);

        afterServerApply?.(null, {
          action: 'RegularAttack',
          defenderIndex: idx,
        });
        return;
      }

      if (!api || typeof api.singleAttackDefender !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.singleAttackDefender available');
        return;
      }

      const web = await api.singleAttackDefender(idx);

      afterServerApply?.(web, {
        action: 'RegularAttack',
        defenderIndex: idx,
      });
    } finally {
      defenderFieldBar.resetSelectedDefender?.();
      busy = false;
    }
  }

  async function onSingleAttackGoalkeeper() {
    if (busy) return;
    try {
      busy = true;

      if (push && typeof push.regularAttack === 'function') {
        push.regularAttack('goalkeeper', null);

        afterServerApply?.(null, {
          action: 'RegularAttack',
          defenderIndex: null,
          target: 'goalkeeper',
        });
        return;
      }

      if (!api || typeof api.singleAttackGoalkeeper !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.singleAttackGoalkeeper available');
        return;
      }

      const web = await api.singleAttackGoalkeeper();

      afterServerApply?.(web, {
        action: 'RegularAttack',
        defenderIndex: null,
        target: 'goalkeeper',
      });
    } finally {
      busy = false;
    }
  }

  async function onDoubleAttack() {
    if (busy || !defenderFieldBar) return;

    const idx = defenderFieldBar.selectedDefenderIndex?.();
    if (idx == null) return;

    lastUsedDefenderIndex = idx;

    try {
      busy = true;

      if (push && typeof push.doubleAttack === 'function') {
        push.doubleAttack(idx);

        afterServerApply?.(null, {
          action: 'DoubleAttack',
          defenderIndex: idx,
        });
        return;
      }

      if (!api || typeof api.doubleAttack !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.doubleAttack available');
        return;
      }

      const web = await api.doubleAttack(idx);

      afterServerApply?.(web, {
        action: 'DoubleAttack',
        defenderIndex: idx,
      });
    } finally {
      defenderFieldBar.resetSelectedDefender?.();
      busy = false;
    }
  }

  async function onSwapSelected() {
    if (busy || !attackerHandBar) return;
    const idx = attackerHandBar.selectedHandIndex?.();
    if (idx == null) return;
    try {
      busy = true;

      if (push && typeof push.swap === 'function') {
        push.swap(idx);
        return;
      }

      if (!api || typeof api.swap !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.swap available');
        return;
      }

      const web = await api.swap(idx);
      applyWeb(web);
    } finally {
      attackerHandBar.resetSelectedHand?.();
      busy = false;
    }
  }

  async function onReverseSwap() {
    if (busy) return;
    try {
      busy = true;


      if (push && typeof push.reverseSwap === 'function') {
        push.reverseSwap();
        return;
      }

      if (!api || typeof api.reverseSwap !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.reverseSwap available');
        return;
      }

      const web = await api.reverseSwap();
      applyWeb(web);
    } finally {
      busy = false;
    }
  }

  async function onUndo() {
    if (busy) return;
    try {
      busy = true;

      if (push && typeof push.undo === 'function') {
        push.undo();
        return;
      }

      if (!api || typeof api.undo !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.undo available');
        return;
      }

      const web = await api.undo();
      applyWeb(web);
    } finally {
      busy = false;
    }
  }

  async function onRedo() {
    if (busy) return;
    try {
      busy = true;

      if (push && typeof push.redo === 'function') {
        push.redo();
        return;
      }

      if (!api || typeof api.redo !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.redo available');
        return;
      }

      const web = await api.redo();
      applyWeb(web);
    } finally {
      busy = false;
    }
  }

  async function onBoostSelected() {
    if (busy || !defenderFieldBar) return;

    const sel = defenderFieldBar.selectedTarget?.();
    try {
      busy = true;

      if (push && typeof push.boost === 'function') {
        if (sel && sel.kind === 'goalkeeper') {
          push.boost('goalkeeper');
        } else {
          const idx =
            sel?.kind === 'defender'
              ? sel.index
              : defenderFieldBar.selectedDefenderIndex?.();
          if (idx == null) return;
          push.boost('defender', idx);
        }
        return;
      }

      if (!api || typeof api.boost !== 'function') {
        console.warn('[PlayingFieldCtrl] No push or api.boost available');
        return;
      }

      if (sel && sel.kind === 'goalkeeper') {
        const web = await api.boost({ target: 'goalkeeper' });
        applyWeb(web);
      } else {
        const idx =
          sel?.kind === 'defender'
            ? sel.index
            : defenderFieldBar.selectedDefenderIndex?.();
        if (idx == null) return;
        const web = await api.boost({ target: 'defender', index: idx });
        applyWeb(web);
      }
    } finally {
      defenderFieldBar.resetSelectedDefender?.();
      defenderFieldBar.clearSelection?.();
      busy = false;
    }
  }

  function updateFromServerContext(webOrMapped) {
    const mapped = mapState(webOrMapped);
    gameState = mapped;

    const mountState = mapped?.players ? mapped : buildSceneShim(mapped);
    mountIfNeeded(mountState);
    refreshUI();
  }

  return {
    updateFromServerContext,

    onSingleAttackDefender,
    onSingleAttackGoalkeeper,
    onDoubleAttack,

    onSwapSelected,
    onReverseSwap,

    onUndo,
    onRedo,

    onBoostSelected,
  };
}
