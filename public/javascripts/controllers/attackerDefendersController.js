import { createDefaultFieldCardRenderer } from '../sceneComponents/fieldCardRenderer.js';
import { createAttackerFieldBar } from '../sceneComponents/attackerFieldBar.js';

export function createAttackerDefendersController({
  api,
  els: { fieldEl, overlay, btnBoost, btnInfo, btnBack, attackerBar },
  onNavigateBack,
  createGameAlert,
  mapWebToScene,
}) {
  let webState = null;
  let rawWeb   = null;
  let fieldBar = null;

  const renderer = createDefaultFieldCardRenderer();

  function mountIfNeeded() {
    if (!fieldEl || !fieldBar) return;
    if (!fieldBar.isMounted?.()) fieldBar.mount(fieldEl);
  }

  function attackerPlayerOf(st) {
    return st?.players?.attacker ?? { id: 'att', name: (st?.roles?.attacker || 'Attacker') };
  }

  function paintBars() {
    attackerBar?.updateFromWebState?.(rawWeb ?? webState);
    fieldBar.updateBar();
  }

  async function refresh() {
    const fresh = await api.fetchGameState();
    rawWeb   = fresh;
    webState = mapWebToScene ? mapWebToScene(fresh) : fresh;
    mountIfNeeded();
    paintBars();
  }

  async function initWithServerState(initialWebState) {
    const base = initialWebState ?? await api.fetchGameState();
    rawWeb   = base;
    webState = mapWebToScene ? mapWebToScene(base) : base;

    const attackerPlayer = attackerPlayerOf(webState);
    fieldBar = createAttackerFieldBar(attackerPlayer, () => webState, renderer);

    mountIfNeeded();
    paintBars();
  }

  function showAlert(message, { autoHideMs = 3000 } = {}) {
    if (!overlay) { alert(message); return; }
    const el = createGameAlert({
      message,
      autoHideMs,
      onOk: () => overlay.hide?.(),
    });
    overlay.show?.(el, { onHide: () => el.cleanup && el.cleanup() });
  }

  async function onBoost() {
    const sel = fieldBar?.selectedTarget?.();
    if (!sel) {
      showAlert('Pick one of your defenders or the goalkeeper to boost.');
      return;
    }
    try {
      if (sel.kind === 'defender') {
        await api.boost({ target: 'defender', index: sel.index });
      } else {
        await api.boost({ target: 'goalkeeper' });
      }
      await refresh();
      fieldBar?.clearSelection?.();
    } catch (e) {
      showAlert('Boost failed. Please try again.');
    }
  }


  btnBoost?.addEventListener('click', onBoost);
  btnInfo?.addEventListener('click', () => {
    showAlert('Boost temporarily increases the selected defender or goalkeeper.', { autoHideMs: 3000 });
  });
  btnBack?.addEventListener('click', () => onNavigateBack?.());

  return { initWithServerState, refresh };
}
