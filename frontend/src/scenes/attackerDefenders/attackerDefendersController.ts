import { createDefaultFieldCardRenderer } from '../../components/fieldCardRenderer';
import { createAttackerFieldBar } from '../../components/attackerFieldBar';
import type { WebGameState, PlayerLike } from '../../types/WebGameState';

type BoostTarget = 'defender' | 'goalkeeper';

interface BoostPayload {
  target: BoostTarget;
  index?: number;
}

interface GameApiLike {
  fetchGameState?(): Promise<WebGameState | null>;
  boost?(payload: BoostPayload): Promise<unknown>;
}

interface PushClientLike {
  boost?(target: BoostTarget, index?: number | null): void;
}

interface OverlayLike {
  show?(
    content: HTMLElement,
    opts?: { autoHide?: boolean; onHide?: () => void },
  ): void;
  hide?(): void;
}

interface GameAlertElement extends HTMLElement {
  cleanup?: () => void;
}

interface CreateGameAlertFn {
  (opts: {
    message: string;
    autoHideMs?: number;
    onOk?: () => void;
  }): GameAlertElement;
}

interface AttackerBarLike {
  updateFromWebState?(state: WebGameState): void;
}

type SelectedTarget =
  | { kind: 'defender'; index: number }
  | { kind: 'goalkeeper' }
  | null;

interface AttackerFieldBar {
  mount(el: HTMLElement | string): void;
  isMounted?(): boolean;
  updateBar?(): void;
  selectedTarget?(): SelectedTarget;
  clearSelection?(): void;
}

type MapWebToSceneFn = (base: WebGameState) => WebGameState;

interface AttackerDefendersControllerEls {
  fieldEl: HTMLElement | null;
  overlay: OverlayLike | null;
  btnBoost?: HTMLButtonElement | null;
  btnInfo?: HTMLButtonElement | HTMLAnchorElement | null;
  btnBack?: HTMLButtonElement | HTMLAnchorElement | null;
  attackerBar?: AttackerBarLike | null;
}

interface AttackerDefendersControllerDeps {
  api?: GameApiLike | null;
  push?: PushClientLike | null;
  els: AttackerDefendersControllerEls;
  onNavigateBack?: () => void;
  createGameAlert: CreateGameAlertFn;
  mapWebToScene?: MapWebToSceneFn;
  onPlayersChange?: (state: WebGameState) => void;
}

export interface AttackerDefendersController {
  initWithServerState(initialWebState?: WebGameState | null): Promise<void>;
  refresh(): Promise<void>;
  updateFromServerContext(state: WebGameState | null): void;
}

export function createAttackerDefendersController({
  api,
  push,
  els: { fieldEl, overlay, btnBoost, btnInfo, btnBack, attackerBar },
  onNavigateBack,
  createGameAlert,
  mapWebToScene,
  onPlayersChange,
}: AttackerDefendersControllerDeps): AttackerDefendersController {
  let webState: WebGameState | null = null;
  let rawWeb: WebGameState | null = null;
  let fieldBar: AttackerFieldBar | null = null;

  const renderer = createDefaultFieldCardRenderer();

  function attackerPlayerOf(st: WebGameState | null): PlayerLike {
    const p = (st as any)?.players?.attacker as PlayerLike | undefined;
    if (p) return p;

    return {
      id: 'att',
      name: st?.roles?.attacker || 'Attacker',
      playerType: 'Human',
    };
  }

  function mountIfNeeded(): void {
    if (!fieldEl) return;

    if (!fieldBar && webState) {
      fieldBar = createAttackerFieldBar(
        () => attackerPlayerOf(webState),
        () => webState,
        renderer,
      );
      fieldBar.mount(fieldEl);
    } else if (fieldBar && !fieldBar.isMounted?.()) {
      fieldBar.mount(fieldEl);
    }
  }

  function updateBoostButtonState(): void {
    if (!btnBoost) return;
    const lim = (webState as any)?.allowed?.attacker ?? {};
    const canBoost = Number(lim?.boostRemaining) > 0;
    btnBoost.disabled = !canBoost;
    btnBoost.classList.toggle('is-disabled', !canBoost);
  }

  function paintBars(): void {
    if (!webState) return;
    attackerBar?.updateFromWebState?.((rawWeb ?? webState) as WebGameState);
    fieldBar?.updateBar?.();
    updateBoostButtonState();
  }

  function applyServerState(base: WebGameState | null): void {
    if (!base) return;
    rawWeb = base;
    webState = mapWebToScene ? mapWebToScene(base) : base;

    mountIfNeeded();
    onPlayersChange?.(base);
    paintBars();
  }

  async function refresh(): Promise<void> {
    if (!api?.fetchGameState) {
      console.warn(
        '[AttDefCtrl] refresh() called but api.fetchGameState is not available',
      );
      return;
    }

    const fresh = await api
      .fetchGameState()
      .catch(() => null as WebGameState | null);
    applyServerState(fresh);
  }

  async function initWithServerState(
    initialWebState?: WebGameState | null,
  ): Promise<void> {
    let base: WebGameState | null | undefined = initialWebState;

    if (!base && api?.fetchGameState) {
      base = await api.fetchGameState().catch(
        () => null as WebGameState | null,
      );
    }

    if (!base) {
      console.warn('[AttDefCtrl] No initial web state available');
      return;
    }

    applyServerState(base);
  }

  function showAlert(
    message: string,
    { autoHideMs = 3000 }: { autoHideMs?: number } = {},
  ): void {
    if (!overlay) {
      alert(message);
      return;
    }
    const el = createGameAlert({
      message,
      autoHideMs,
      onOk: () => overlay?.hide?.(),
    });
    overlay.show?.(el, {
      onHide: () => el.cleanup && el.cleanup(),
    });
  }

  async function onBoost(): Promise<void> {
    const lim = (webState as any)?.allowed?.attacker ?? {};
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
      if (push?.boost) {
        if (sel.kind === 'defender') {
          push.boost('defender', sel.index);
        } else {
          push.boost('goalkeeper');
        }
        fieldBar?.clearSelection?.();
        return;
      }

      if (!api?.boost) {
        console.warn(
          '[AttDefCtrl] No push or api.boost available for Boost action',
        );
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
    showAlert(
      'Boost temporarily increases the selected defender or goalkeeper.',
      { autoHideMs: 3000 },
    );
  });
  btnBack?.addEventListener('click', () => onNavigateBack?.());

  return {
    initWithServerState,
    refresh,
    updateFromServerContext: applyServerState,
  };
}
