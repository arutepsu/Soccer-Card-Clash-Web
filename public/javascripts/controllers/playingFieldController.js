// /assets/javascripts/controllers/PlayingFieldController.js
export function createPlayingFieldController({
  api,
  fieldRenderer,
  handRenderer,
  createPlayersFieldBar,
  createPlayersHandBar,
  elField,
  elHand,
  mapWebToScene,
}) {
  let gameState = null;
  const getGS = () => gameState;

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
    try {
      busy = true;
      const web = await api.singleAttackDefender(idx);
      applyWeb(web);
    } finally {
      defenderFieldBar.resetSelectedDefender?.();
      busy = false;
    }
  }

  async function onSingleAttackGoalkeeper() {
    if (busy) return;
    try {
      busy = true;
      const web = await api.singleAttackGoalkeeper();
      applyWeb(web);
    } finally {
      busy = false;
    }
  }

  async function onDoubleAttack() {
    if (busy || !defenderFieldBar) return;
    const idx = defenderFieldBar.selectedDefenderIndex?.();
    if (idx == null) return;
    try {
      busy = true;
      const web = await api.doubleAttack(idx);
      applyWeb(web);
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
