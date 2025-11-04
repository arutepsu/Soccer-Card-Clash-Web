// /assets/javascripts/attackerDefendersScene.js
import { createGameApi } from './api/gameApi.js';
import { createOverlay } from './overlay.js';
import { createGameAlert } from './utils/gameAlert.js';
import { createAttackerDefendersController } from './controllers/attackerDefendersController.js';
import { createPlayerAvatarRegistry } from './utils/playersAvatarRegistry.js';
import { createAttackerBar } from './sceneComponents/attackerBar.js';

const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.content;

document.addEventListener('DOMContentLoaded', async () => {
  const els = {
    playerBarEl: document.getElementById('attacker-bar'),
    fieldEl:     document.getElementById('attacker-defenders-field'),
    overlayEl:   document.getElementById('overlay'),
    btnBoost:    document.getElementById('btn-boost'),
    btnInfo:     document.getElementById('btn-info'),
    btnBack:     document.getElementById('btn-back'),
  };

  const api     = createGameApi({ csrfToken: getCsrf() });
  const overlay = els.overlayEl ? createOverlay({ host: els.overlayEl }) : null;

  const avatarRegistry = createPlayerAvatarRegistry({
    avatarsPath: '/assets/images/players/',
    fileNames: ['player1.jpg', 'player2.jpg', 'ai.jpg', 'taka.jpg', 'defendra.jpg', 'bitstrom.jpg', 'meta.jpg']
  });
  await avatarRegistry.preloadAvatars().catch(() => {});

  function assignAvatarsFrom(state) {
    if (!state) return;
    const attacker = state.players?.attacker ?? { id: 'att', name: state.roles?.attacker, playerType: 'Human' };
    const defender = state.players?.defender ?? { id: 'def', name: state.roles?.defender, playerType: 'Human' };
    avatarRegistry.assignAvatarsInOrder([attacker, defender]);
  }

  const mapWebToScene = (st) => {
    if (!st) return st;
  const m = (c) => {
    if (!c) return null;
    const boosted =
      !!c.isBoosted ||
      !!c.boosted ||
      c.kind === 'BoostedCard' ||
      c.type === 'BoostedCard' ||
      c.cardType === 'BoostedCard';
    return { fileName: c.fileName, isBoosted: boosted };
  };
    return {
      ...st,
      cards: {
        ...st.cards,
        attackerField: (st.cards?.attackerField ?? []).map(slot => ({
          ...slot,
          card: m(slot?.card),
        })),
        defenderField: (st.cards?.defenderField ?? []).map(slot => ({
          ...slot,
          card: m(slot?.card),
        })),
        attackerGoalkeeper: m(st.cards?.attackerGoalkeeper),
        defenderGoalkeeper: m(st.cards?.defenderGoalkeeper),
      },
    };
  };

  const attackerBar = createAttackerBar(avatarRegistry);
    attackerBar.mount(els.playerBarEl);

    const initial = await api.fetchGameState().catch(() => null);
    if (initial) {
      assignAvatarsFrom(initial);
      attackerBar.updateFromWebState?.(initial);
    }

    const controller = createAttackerDefendersController({
      api,
      els: { ...els, overlay, attackerBar },
      onNavigateBack: () => { window.location.href = '/playing-field'; },
      createGameAlert,
      mapWebToScene,
      onPlayersChange: (state) => {
      assignAvatarsFrom(state);
      attackerBar.updateFromWebState?.(state);
    },
    });

    await controller.initWithServerState(initial);
});
