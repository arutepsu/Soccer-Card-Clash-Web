import { createDefaultFieldCardRenderer } from '../sceneComponents/fieldCardRenderer.js';
import { createAttackerFieldBar } from '../sceneComponents/attackerFieldBar.js';

export function createAttackerDefendersController({
  api,
  push,
  els: { fieldEl, overlay, btnBoost, btnInfo, btnBack, attackerBar },
  onNavigateBack,
  createGameAlert,
  mapWebToScene,
  onPlayersChange,
}) {
  let webState = null;
  let rawWeb   = null;
  let fieldBar = null;

  let lastAttackerName = null;

  const renderer = createDefaultFieldCardRenderer({
    boostImg: '/assets/images/cards/effects/boost.png',
  });

  function mountIfNeeded() {
    if (!fieldEl || !fieldBar) return;
    if (!fieldBar.isMounted?.()) fieldBar.mount(fieldEl);
  }

  function attackerPlayerOf(st) {
    return st?.players?.attacker ?? {
      id: 'att',
      name: st?.roles?.attacker || 'Attacker',
    };
  }

  function updateBoostButtonState() {
    if (!btnBoost) return;
    const lim = webState?.allowed?.attacker || {};
    const canBoost = Number(lim?.boostRemaining) > 0;
    btnBoost.disabled = !canBoost;
    btnBoost.classList.toggle('is-disabled', !canBoost);
  }

  function rebuildFieldBarIfAttackerChanged(state) {
    const att = attackerPlayerOf(state);
    if (att?.name !== lastAttackerName) {
      lastAttackerName = att?.name ?? null;
      fieldBar = createAttackerFieldBar(att, () => webState, renderer);
      mountIfNeeded();
      onPlayersChange?.(state);
    }
  }

  function paintBars() {
    attackerBar?.updateFromWebState?.(rawWeb ?? webState);
    fieldBar?.updateBar?.();
    updateBoostButtonState();
  }

  async function refresh() {
    if (!api || typeof api.fetchGameState !== 'function') {
      console.warn('[AttDefCtrl] refresh() called but api.fetchGameState is not available');
      return;
    }

    const fresh = await api.fetchGameState();
    rawWeb   = fresh;
    webState = mapWebToScene ? mapWebToScene(fresh) : fresh;

    rebuildFieldBarIfAttackerChanged(fresh);
    mountIfNeeded();
    paintBars();
  }

  const getCurrentAttacker = () => attackerPlayerOf(webState);

  async function initWithServerState(initialWebState) {
    let base = initialWebState;

    if (!base && api && typeof api.fetchGameState === 'function') {
      base = await api.fetchGameState().catch(() => null);
    }

    if (!base) {
      console.warn('[AttDefCtrl] No initial web state available');
      return;
    }

    rawWeb   = base;
    webState = mapWebToScene ? mapWebToScene(base) : base;

    const attackerPlayer = attackerPlayerOf(webState);
    lastAttackerName = attackerPlayer?.name ?? null;
    fieldBar = createAttackerFieldBar(getCurrentAttacker, () => webState, renderer);

    mountIfNeeded();
    onPlayersChange?.(base);
    paintBars();
  }

  function showAlert(message, { autoHideMs = 3000 } = {}) {
    if (!overlay) {
      alert(message);
      return;
    }
    const el = createGameAlert({ message, autoHideMs, onOk: () => overlay.hide?.() });
    overlay.show?.(el, { onHide: () => el.cleanup && el.cleanup() });
  }

  async function onBoost() {
    const lim = webState?.allowed?.attacker || {};
    if (!(Number(lim?.boostRemaining) > 0)) {
      showAlert('Boost is not available for the current attacker right now.');
      return;
    }

    const sel = fieldBar?.selectedTarget?.();
    if (!sel) {
      showAlert('Pick one of your defenders or the goalkeeper to boost.');
      return;
    }

    try {
      if (push && typeof push.boost === 'function') {
        if (sel.kind === 'defender') {
          push.boost('defender', sel.index);
        } else {
          push.boost('goalkeeper');
        }
        fieldBar?.clearSelection?.();
        return;
      }

      if (!api || typeof api.boost !== 'function') {
        console.warn('[AttDefCtrl] No push or api.boost available for Boost action');
        showAlert('Boost is currently unavailable.');
        return;
      }

      if (sel.kind === 'defender') {
        await api.boost({ target: 'defender', index: sel.index });
      } else {
        await api.boost({ target: 'goalkeeper' });
      }

      await refresh();
      fieldBar?.clearSelection?.();
    } catch (e) {
      console.error('[AttDefCtrl] Boost failed:', e);
      showAlert('Boost failed. Please try again.');
    }
  }

  btnBoost?.addEventListener('click', onBoost);
  btnInfo?.addEventListener('click', () => {
    showAlert('Boost temporarily increases the selected defender or goalkeeper.', {
      autoHideMs: 3000,
    });
  });
  btnBack?.addEventListener('click', () => onNavigateBack?.());

  return { initWithServerState, refresh };
}
