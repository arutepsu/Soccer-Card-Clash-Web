import { createAttackerHandController } from './controllers/attackerHandController.js';
import { createPlayerAvatarRegistry } from './utils/playersAvatarRegistry.js';
import { createAttackerBar } from './sceneComponents/attackerBar.js';

function assignAvatarsFrom(registry, state) {
  if (!state) return;
  const attacker = state.players?.attacker ?? {
    id: 'att',
    name: state.roles?.attacker,
    playerType: 'Human',
  };
  const defender = state.players?.defender ?? {
    id: 'def',
    name: state.roles?.defender,
    playerType: 'Human',
  };
  registry.assignAvatarsInOrder([attacker, defender]);
}

export async function build({ api, push, overlay, createGameAlert }) {
  const els = {
    playerBarEl:     document.getElementById('attacker-bar'),
    handEl:          document.getElementById('attacker-hand'),
    btnRegularSwap:  document.getElementById('btn-regular-swap'),
    btnReverseSwap:  document.getElementById('btn-reverse-swap'),
    btnInfo:         document.getElementById('btn-info'),
    btnBack:         document.getElementById('btn-back'),
  };

  if (!els.handEl || !els.playerBarEl) {
    console.error('[AttackerHandScene] Missing #attacker-hand or #attacker-bar');
    return { destroy() {}, refresh: async () => {} };
  }

  const avatarRegistry = createPlayerAvatarRegistry({
    avatarsPath: '/assets/images/players/',
    fileNames: [
      'player1.jpg',
      'player2.jpg',
      'ai.jpg',
      'taka.jpg',
      'defendra.jpg',
      'bitstrom.jpg',
      'meta.jpg',
    ],
  });
  await avatarRegistry.preloadAvatars().catch(() => {});

  const attackerBar = createAttackerBar(avatarRegistry);
  attackerBar.mount(els.playerBarEl);

  const initial =
    api && typeof api.fetchGameState === 'function'
      ? await api.fetchGameState().catch(() => null)
      : null;

  if (initial) {
    assignAvatarsFrom(avatarRegistry, initial);
    attackerBar.updateFromWebState?.(initial);
  }

  const controller = createAttackerHandController({
    api,
    push,
    els: {
      elHand:         els.handEl,
      btnRegularSwap: els.btnRegularSwap,
      btnReverseSwap: els.btnReverseSwap,
      btnInfo:        els.btnInfo,
      btnBack:        els.btnBack,
      overlay,
      attackerBar,
    },
    createGameAlert,
    onNavigateBack: () => {
      window.location.href = '/playing-field';
    },
  });

  await controller.initWithServerState(initial);

  let streamHandle = null;
  if (api && typeof api.openStream === 'function') {
    streamHandle = api.openStream((web) => {
      if (!web) return;
      assignAvatarsFrom(avatarRegistry, web);
      attackerBar.updateFromWebState?.(web);
      controller.updateFromServerContext(web);
    });
  }

  function destroy() {
    try { streamHandle?.close?.(); } catch {}

    ['btnRegularSwap', 'btnReverseSwap', 'btnInfo', 'btnBack'].forEach((key) => {
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
