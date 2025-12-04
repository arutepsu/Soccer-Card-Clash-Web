// import { createDefaultFieldCardRenderer } from '../../components/fieldCardRenderer';
// import { createAttackerFieldBar } from '../../components/attackerFieldBar';
// import type { WebGameState, PlayerLike } from '../../types/WebGameState';

// type BoostTarget = 'defender' | 'goalkeeper';

// interface BoostPayload {
//   target: BoostTarget;
//   index?: number;
// }

// interface GameApiLike {
//   fetchGameState?(): Promise<WebGameState | null>;
//   boost?(payload: BoostPayload): Promise<WebGameState | null>;
// }

// interface OverlayLike {
//   show?(
//     content: HTMLElement,
//     opts?: { autoHide?: boolean; onHide?: () => void },
//   ): void;
//   hide?(): void;
// }

// interface GameAlertElement extends HTMLElement {
//   cleanup?: () => void;
// }

// interface CreateGameAlertFn {
//   (opts: {
//     message: string;
//     autoHideMs?: number;
//     onOk?: () => void;
//   }): GameAlertElement;
// }

// interface AttackerBarLike {
//   updateFromWebState?(state: WebGameState): void;
// }

// type SelectedTarget =
//   | { kind: 'defender'; index: number }
//   | { kind: 'goalkeeper' }
//   | null;

// interface AttackerFieldBar {
//   mount(el: HTMLElement | string): void;
//   isMounted?(): boolean;
//   updateBar?(): void;
//   selectedTarget?(): SelectedTarget;
//   clearSelection?(): void;
// }

// interface AttackerDefendersControllerEls {
//   fieldEl: HTMLElement | null;
//   overlay: OverlayLike | null;
//   btnBoost?: HTMLButtonElement | null;
//   btnInfo?: HTMLButtonElement | HTMLAnchorElement | null;
//   btnBack?: HTMLButtonElement | HTMLAnchorElement | null;
//   attackerBar?: AttackerBarLike | null;
// }

// interface AttackerDefendersControllerDeps {
//   api?: GameApiLike | null;
//   els: AttackerDefendersControllerEls;
//   onNavigateBack?: () => void;
//   createGameAlert: CreateGameAlertFn;
//   onPlayersChange?: (state: WebGameState) => void;
// }

// export interface AttackerDefendersController {
//   initWithServerState(initialWebState?: WebGameState | null): Promise<void>;
//   refresh(): Promise<void>;
//   updateFromServerContext(state: WebGameState | null): void;
// }

// export function createAttackerDefendersController({
//   api,
//   els: { fieldEl, overlay, btnBoost, btnInfo, btnBack, attackerBar },
//   onNavigateBack,
//   createGameAlert,
//   onPlayersChange,
// }: AttackerDefendersControllerDeps): AttackerDefendersController {
//   let webState: WebGameState | null = null;
//   let rawWeb: WebGameState | null = null;
//   let fieldBar: AttackerFieldBar | null = null;

//   const renderer = createDefaultFieldCardRenderer();

//   function attackerPlayerOf(st: WebGameState | null): PlayerLike {
//     const p = (st as any)?.players?.attacker as PlayerLike | undefined;
//     if (p) return p;

//     return {
//       id: 'att',
//       name: st?.roles?.attacker || 'Attacker',
//       playerType: 'Human',
//     };
//   }

//   function mountIfNeeded(): void {
//     if (!fieldEl) return;

//     if (!fieldBar && webState) {
//       fieldBar = createAttackerFieldBar(
//         () => attackerPlayerOf(webState),
//         () => webState,
//         renderer,
//       );
//       fieldBar.mount(fieldEl);
//     } else if (fieldBar && !fieldBar.isMounted?.()) {
//       fieldBar.mount(fieldEl);
//     }
//   }

//   function updateBoostButtonState(): void {
//     if (!btnBoost) return;
//     const lim = (webState as any)?.allowed?.attacker ?? {};
//     const canBoost = Number(lim?.boostRemaining) > 0;
//     btnBoost.disabled = !canBoost;
//     btnBoost.classList.toggle('is-disabled', !canBoost);
//   }

//   function paintBars(): void {
//     if (!webState) return;
//     attackerBar?.updateFromWebState?.(webState as WebGameState);
//     fieldBar?.updateBar?.();
//     updateBoostButtonState();
//   }

//   function applyServerState(base: WebGameState | null): void {
//     if (!base) return;
//     rawWeb = base;
//     webState = base;

//     mountIfNeeded();
//     onPlayersChange?.(base);
//     paintBars();
//   }

//   async function refresh(): Promise<void> {
//     if (!api?.fetchGameState) {
//       console.warn(
//         '[AttDefCtrl] refresh() called but api.fetchGameState is not available',
//       );
//       return;
//     }

//     const fresh = await api
//       .fetchGameState()
//       .catch(() => null as WebGameState | null);
//     applyServerState(fresh);
//   }

//   async function initWithServerState(
//     initialWebState?: WebGameState | null,
//   ): Promise<void> {
//     let base: WebGameState | null | undefined = initialWebState;

//     if (!base && api?.fetchGameState) {
//       base = await api.fetchGameState().catch(
//         () => null as WebGameState | null,
//       );
//     }

//     if (!base) {
//       console.warn('[AttDefCtrl] No initial web state available');
//       return;
//     }

//     applyServerState(base);
//   }

//   function showAlert(
//     message: string,
//     { autoHideMs = 3000 }: { autoHideMs?: number } = {},
//   ): void {
//     if (!overlay) {
//       alert(message);
//       return;
//     }
//     const el = createGameAlert({
//       message,
//       autoHideMs,
//       onOk: () => overlay?.hide?.(),
//     });
//     overlay.show?.(el, {
//       onHide: () => el.cleanup && el.cleanup(),
//     });
//   }

//   async function onBoost(): Promise<void> {
//     const lim = (webState as any)?.allowed?.attacker ?? {};
//     if (!(Number(lim?.boostRemaining) > 0)) {
//       showAlert('Boost is not available for the current attacker right now.');
//       return;
//     }

//     const sel = fieldBar?.selectedTarget?.();
//     if (!sel) {
//       showAlert('Pick one of your defenders or the goalkeeper to boost.');
//       return;
//     }

//     if (!api?.boost) {
//       console.warn(
//         '[AttDefCtrl] No api.boost available for Boost action',
//       );
//       showAlert('Boost is currently unavailable.');
//       return;
//     }

//     try {
//       let web: WebGameState | null = null;

//       if (sel.kind === 'defender') {
//         web = await api.boost({ target: 'defender', index: sel.index });
//       } else {
//         web = await api.boost({ target: 'goalkeeper' });
//       }

//       if (web) {
//         applyServerState(web);
//       }
//       fieldBar?.clearSelection?.();
//     } catch (e) {
//       console.error('[AttDefCtrl] Boost failed:', e);
//       showAlert('Boost failed. Please try again.');
//     }
//   }

//   btnBoost?.addEventListener('click', onBoost);
//   btnInfo?.addEventListener('click', () => {
//     showAlert(
//       'Boost temporarily increases the selected defender or goalkeeper.',
//       { autoHideMs: 3000 },
//     );
//   });
//   btnBack?.addEventListener('click', () => onNavigateBack?.());

//   return {
//     initWithServerState,
//     refresh,
//     updateFromServerContext: applyServerState,
//   };
// }
