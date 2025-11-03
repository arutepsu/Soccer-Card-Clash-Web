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

  async function onSingleAttack() {
    if (!defenderFieldBar) return;
    const idx = defenderFieldBar.selectedDefenderIndex();
    if (idx == null) return; 
    try {
      const web = await api.singleAttack(idx);
      const mapped = mapWebToScene ? mapWebToScene(web) : web;
      gameState = mapped;
      refreshUI();
    } finally {
      defenderFieldBar.resetSelectedDefender();
    }
  }


  function updateFromServerContext(webOrMapped) {
    const mapped = mapWebToScene ? mapWebToScene(webOrMapped) : webOrMapped;
    gameState = mapped;

    const mountState = mapped?.players ? mapped : buildSceneShim(mapped);
    mountIfNeeded(mountState);

    refreshUI();
  }

  function buildSceneShim(web) {
    const attacker = { id: 'att', name: web.roles.attacker, playerType: 'Human' };
    const defender = { id: 'def', name: web.roles.defender, playerType: 'Human' };
    return { players: { attacker, defender } };
  }

  return { updateFromServerContext, onSingleAttack };
}
