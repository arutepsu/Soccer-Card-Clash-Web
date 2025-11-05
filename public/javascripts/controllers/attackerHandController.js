// controllers/attackerHandController.js

import { createDefaultHandCardRenderer } from '../sceneComponents/handCardRenderer.js';
import { createAttackerHandBar } from '../sceneComponents/attackerHandBar.js';
import { createCardImageRegistry } from '../utils/cardImageRegistry.js';

function buildMapWebToScene(cardRegistry) {
  const toImg = (f) => cardRegistry.getImageForCard(f);
  const back  = cardRegistry.getImageUrl('flippedCard.png');

  const mapHand = (list = []) => list.map((c, i, arr) => {
    const isLast = i === arr.length - 1;
    const front  = toImg(c?.fileName);
   return {
     fileName: c?.fileName,
     imgFront: front,
     imgBack : back,
     img     : isLast ? front : back
   };
  });

  return function mapWebToScene(web) {
    const attacker = {
      id: 'att',
      name: web.roles?.attacker,
      score: web.scores?.attacker,
      playerType: 'Human',
      actionStates: web.allowed?.attacker
    };
    const defender = {
      id: 'def',
      name: web.roles?.defender,
      score: web.scores?.defender,
      playerType: 'Human',
      actionStates: web.allowed?.defender
    };
    return {
      players: { attacker, defender },
      gameCards: {
        hands: {
          att: mapHand(web.cards?.attackerHand),
          def: mapHand(web.cards?.defenderHand),
        }
      },
      allowed: web.allowed
    };
  };
}

export function createAttackerHandController({
  api,
  els: { elHand, btnRegularSwap, btnReverseSwap, btnInfo, btnBack, overlay, attackerBar },
  createGameAlert,
}) {
  let gs = null;
  const getGS = () => gs;
  let handBar = null;
  let busy = false;

  const cardRegistry = createCardImageRegistry();
  const handRenderer = createDefaultHandCardRenderer();
  const mapWebToScene = buildMapWebToScene(cardRegistry);

  function attackerRef(state) {
    return state?.players?.attacker ?? { id: 'att', name: state?.roles?.attacker, playerType: 'Human' };
  }

  async function init() {
    await initWithServerState();
  }

  async function initWithServerState(initialWeb) {
    await cardRegistry.preloadAll().catch(() => {});
    const web = initialWeb ?? await api.fetchGameState();
    gs = mapWebToScene(web);

    handBar = createAttackerHandBar(
      () => getGS()?.players?.attacker,
      getGS,
      handRenderer
    );
    handBar.mount(elHand);
    handBar.updateBar();
    attackerBar?.updateFromWebState?.(web);

    wireButtons();
  }

  function wireButtons() {
    btnInfo?.addEventListener('click', () => {
      const alert = createGameAlert?.({ message: 'Select a card then choose a swap action.' });
      if (overlay && alert) overlay.show(alert, { onHide: () => alert.cleanup?.() });
    });

    btnRegularSwap?.addEventListener('click', onSwapSelected);
    btnReverseSwap?.addEventListener('click', onReverseSwap);
    btnBack?.addEventListener('click', () => { /* your navigation logic */ });
  }

  function applyWeb(web) {
    gs = mapWebToScene(web);
    handBar?.updateBar();
    attackerBar?.updateFromWebState?.(web);
  }
  async function onSwapSelected() {
    if (busy || !handBar) return;
    const idx = handBar.selectedHandIndex?.();
    if (idx == null) {
      showAlert('Pick a card in your hand to swap.');
      return;
    }
    try {
      busy = true;
      const web = await api.swap(idx);
      applyWeb(web);
    } catch {
      showAlert('Swap failed. Try again.');
    } finally {
      handBar.resetSelectedHand?.();
      busy = false;
    }
  }

  async function onReverseSwap() {
    if (busy) return;
    try {
      busy = true;
      const web = await api.reverseSwap();
      applyWeb(web);
    } catch {
      showAlert('Reverse swap failed. Try again.');
    } finally {
      busy = false;
    }
  }

  function showAlert(message) {
    if (!overlay || !createGameAlert) { alert(message); return; }
    const el = createGameAlert({ message, autoHideMs: 2500, onOk: () => overlay.hide?.() });
    overlay.show?.(el, { onHide: () => el.cleanup?.() });
  }

  function updateFromServerContext(web) {
    applyWeb(web);
    attackerBar?.updateFromWebState?.(web);
  }

  async function refresh() {
    const web = await api.fetchGameState().catch(() => null);
    if (web) applyWeb(web);
  }

  function destroy() {
  }

  return { init, initWithServerState, updateFromServerContext, refresh, destroy };
}
