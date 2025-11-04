// public/javascripts/attackerDefenderScene.js
import { createAttackerDefendersController } from './controllers/attackerDefendersController.js';
import { createPlayerAvatarRegistry } from './utils/playersAvatarRegistry.js';
import { createAttackerBar } from './sceneComponents/attackerBar.js';

function assignAvatarsFrom(registry, state) {
  if (!state) return;
  const attacker = state.players?.attacker ?? { id: 'att', name: state.roles?.attacker, playerType: 'Human' };
  const defender = state.players?.defender ?? { id: 'def', name: state.roles?.defender, playerType: 'Human' };
  registry.assignAvatarsInOrder([attacker, defender]);
}

function mapWebToScene(st) {
  if (!st) return st;
  const m = (c) => {
    if (!c) return null;
    const boosted = !!c.isBoosted || !!c.boosted ||
      c.kind === 'BoostedCard' || c.type === 'BoostedCard' || c.cardType === 'BoostedCard';
    return { fileName: c.fileName, isBoosted: boosted };
  };
  return {
    ...st,
    cards: {
      ...st.cards,
      attackerField: (st.cards?.attackerField ?? []).map(slot => ({ ...slot, card: m(slot?.card) })),
      defenderField: (st.cards?.defenderField ?? []).map(slot => ({ ...slot, card: m(slot?.card) })),
      attackerGoalkeeper: m(st.cards?.attackerGoalkeeper),
      defenderGoalkeeper: m(st.cards?.defenderGoalkeeper),
    },
  };
}

export async function build({ api, overlay, createGameAlert }) {
  const els = {
    playerBarEl: document.getElementById('attacker-bar'),
    fieldEl:     document.getElementById('attacker-defenders-field'),
    btnBoost:    document.getElementById('btn-boost'),
    btnInfo:     document.getElementById('btn-info'),
    btnBack:     document.getElementById('btn-back'),
  };

  if (!els.fieldEl || !els.playerBarEl) {
    console.error('[AttackerDefenderScene] Missing #attacker-defenders-field or #attacker-bar');
    return { destroy() {}, refresh: async () => {} };
  }

  const avatarRegistry = createPlayerAvatarRegistry({
    avatarsPath: '/assets/images/players/',
    fileNames: ['player1.jpg', 'player2.jpg', 'ai.jpg', 'taka.jpg', 'defendra.jpg', 'bitstrom.jpg', 'meta.jpg']
  });
  await avatarRegistry.preloadAvatars().catch(() => {});

  const attackerBar = createAttackerBar(avatarRegistry);
  attackerBar.mount(els.playerBarEl);

  const initial = await api.fetchGameState().catch(() => null);
  if (initial) {
    assignAvatarsFrom(avatarRegistry, initial);
    attackerBar.updateFromWebState?.(initial);
  }

  const controller = createAttackerDefendersController({
    api,
    els: { ...els, overlay, attackerBar },
    onNavigateBack: () => { window.location.href = '/playing-field'; },
    createGameAlert,
    mapWebToScene,
    onPlayersChange: (state) => {
      assignAvatarsFrom(avatarRegistry, state);
      attackerBar.updateFromWebState?.(state);
    },
  });

  await controller.initWithServerState(initial);

  function destroy() {
    ['btnBoost', 'btnInfo', 'btnBack'].forEach(key => {
      const el = els[key];
      if (el && el.parentNode) {
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
      }
    });
  }

  return {
    destroy,
    refresh: controller.refresh,
  };
}
