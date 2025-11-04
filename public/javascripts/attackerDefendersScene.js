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
  
  const attackerBar = createAttackerBar(avatarRegistry);
    attackerBar.mount(els.playerBarEl);

    // ✅ fetch state first
    const initial = await api.fetchGameState().catch(() => null);
    if (initial) {
      // ✅ assign avatars using the SAME ids the UI uses
      const attackerRef = { id: 'att', name: initial.roles.attacker, playerType: 'Human' };
      const defenderRef = { id: 'def', name: initial.roles.defender, playerType: 'Human' };
      avatarRegistry.assignAvatarsInOrder([attackerRef, defenderRef]);

      // optional: push to bar once
      attackerBar.updateFromWebState?.(initial);
    }

    // ✅ init controller with the same state so bars/field stay consistent
    const controller = createAttackerDefendersController({
      api,
      els: { ...els, overlay, attackerBar },
      onNavigateBack: () => { window.location.href = '/playing-field'; },
      createGameAlert,
      // (mapWebToScene optional if your controller expects it)
    });

    await controller.initWithServerState(initial);
});
