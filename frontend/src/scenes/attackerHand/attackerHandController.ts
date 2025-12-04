// import type { WebGameState } from '../../types/WebGameState';
// import {
//   createDefaultHandCardRenderer,
// } from '../../components/handCardRenderer';
// import {
//   createAttackerHandBar,
//   type AttackerHandBar,
//   type GetGameState,
//   type HandCardLike,
// } from '../../components/attackerHandBar';
// import {
//   createCardImageRegistry,
//   type CardImageRegistry,
// } from '../../utils/cardImageRegistry';
// import type { AttackerBarComponent } from '../../components/attackerBar';
// import type { PlayerLike } from '../../types/Player';

// interface GameApiLike {
//   fetchGameState?(): Promise<WebGameState | null>;
//   swap?(index: number): Promise<WebGameState>;
//   reverseSwap?(): Promise<WebGameState>;
// }

// interface OverlayLike {
//   show?(
//     content: HTMLElement,
//     opts?: { onHide?: () => void },
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

// interface AttackerHandControllerEls {
//   elHand: HTMLElement | null;
//   btnRegularSwap?: HTMLButtonElement | HTMLAnchorElement | null;
//   btnReverseSwap?: HTMLButtonElement | HTMLAnchorElement | null;
//   btnInfo?: HTMLButtonElement | HTMLAnchorElement | null;
//   btnBack?: HTMLButtonElement | HTMLAnchorElement | null;
//   overlay?: OverlayLike | null;
//   attackerBar?: AttackerBarComponent | null;
// }


// export interface AttackerHandControllerDeps {
//   api: GameApiLike;
//   els: AttackerHandControllerEls;
//   createGameAlert?: CreateGameAlertFn;
//   onNavigateBack?: () => void;
// }
// export interface AttackerHandController {
//   initWithServerState(initialWebState?: WebGameState | null): Promise<void>;
//   updateFromServerContext(web: WebGameState): void;
//   refresh(): Promise<void>;
//   destroy(): void;
// }

// type EnrichedState = WebGameState & {
//   players?: {
//     attacker?: PlayerLike;
//     defender?: PlayerLike;
//   };
//   gameCards?: {
//     hands?: {
//       att?: HandCardLike[];
//       def?: HandCardLike[];
//     };
//     [key: string]: unknown;
//   };
// };

// function buildMapWebToScene(
//   cardRegistry: CardImageRegistry,
// ): (web: WebGameState) => EnrichedState {
//   const toImg = (f?: string | null): string =>
//     cardRegistry.getImageForCard(f ?? '');
//   const back = cardRegistry.getImageUrl('flippedCard.png');

//   const mapHand = (list: any[] | undefined | null = []): HandCardLike[] =>
//     (list ?? []).map((c, i, arr) => {
//       const isLast = i === arr.length - 1;
//       const front = toImg(c?.fileName);
//       return {
//         fileName: c?.fileName,
//         imgFront: front,
//         imgBack: back,
//         img: isLast ? front : back,
//       };
//     });

//   return function mapWebToScene(web: WebGameState): EnrichedState {
//     const attacker: PlayerLike = {
//       id: 'att',
//       name: web.roles?.attacker,
//       playerType: 'Human',
//     };
//     const defender: PlayerLike = {
//       id: 'def',
//       name: web.roles?.defender,
//       playerType: 'Human',
//     };

//     return {
//       ...(web as any),
//       players: { attacker, defender },
//       gameCards: {
//         ...(web as any).gameCards,
//         hands: {
//           att: mapHand(web.cards?.attackerHand as any),
//           def: mapHand(web.cards?.defenderHand as any),
//         },
//       },
//     };
//   };
// }

// export function createAttackerHandController({
//   api,
//   els: {
//     elHand,
//     btnRegularSwap,
//     btnReverseSwap,
//     btnInfo,
//     btnBack,
//     overlay,
//     attackerBar,
//   },
//   createGameAlert,
//   onNavigateBack,
// }: AttackerHandControllerDeps): AttackerHandController {
//   let gs: EnrichedState | null = null;
//   const getGS: GetGameState = () => (gs as WebGameState | null);

//   let handBar: AttackerHandBar | null = null;
//   let busy = false;

//   const cardRegistry = createCardImageRegistry();
//   const handRenderer = createDefaultHandCardRenderer();
//   const mapWebToScene = buildMapWebToScene(cardRegistry);

//   async function initWithServerState(
//     initialWeb?: WebGameState | null,
//   ): Promise<void> {
//     if (!elHand) {
//       console.warn('[AttackerHandController] elHand is null');
//       return;
//     }

//     await cardRegistry.preloadAll().catch(() => {});

//     const web: WebGameState | null =
//       initialWeb ??
//       (api
//         ? await api.fetchGameState().catch(() => null)
//         : null);

//     if (!web) {
//       console.warn('[AttackerHandController] No initial web state available');
//       return;
//     }

//     gs = mapWebToScene(web);

//     handBar = createAttackerHandBar(
//       () =>
//         (gs?.players?.attacker
//           ? { id: gs.players.attacker.id, name: gs.players.attacker.name ?? null }
//           : { id: 'att', name: web.roles?.attacker ?? null }),
//       getGS,
//       handRenderer,
//     );
//     handBar.mount(elHand);
//     handBar.updateBar();

//     attackerBar?.updateFromWebState?.(web);

//     wireButtons();
//   }


//   function wireButtons(): void {
//     btnInfo?.addEventListener('click', () => {
//       if (!createGameAlert) {
//         alert('Select a card then choose a swap action.');
//         return;
//       }
//       const alertEl = createGameAlert({
//         message: 'Select a card then choose a swap action.',
//       });
//       if (overlay && alertEl) {
//         overlay.show?.(alertEl, { onHide: () => alertEl.cleanup?.() });
//       }
//     });

//     btnRegularSwap?.addEventListener('click', onSwapSelected);
//     btnReverseSwap?.addEventListener('click', onReverseSwap);
//     btnBack?.addEventListener('click', () => {
//       onNavigateBack?.();
//     });
//   }

//   function applyWeb(web: WebGameState): void {
//     gs = mapWebToScene(web);
//     handBar?.updateBar();
//     attackerBar?.updateFromWebState?.(web);
//   }

//  async function onSwapSelected(): Promise<void> {
//     if (busy || !handBar) return;
//     const idx = handBar.selectedHandIndex?.();
//     if (idx == null || idx < 0) {
//       showAlert('Pick a card in your hand to swap.');
//       return;
//     }

//     if (!api || typeof api.swap !== 'function') {
//       console.warn('[AttackerHandController] api.swap not available');
//       showAlert('Swap is currently unavailable.');
//       return;
//     }

//     try {
//       busy = true;

//       const web = await api.swap(idx);


//       if (web) {
//         applyWeb(web);
//       }
//     } catch (err) {
//       console.error('[AttackerHandController] Swap failed:', err);
//       showAlert('Swap failed. Try again.');
//     } finally {
//       handBar.resetSelectedHand?.();
//       busy = false;
//     }
//   }

//   async function onReverseSwap(): Promise<void> {
//     if (busy) return;

//     if (!api || typeof api.reverseSwap !== 'function') {
//       console.warn('[AttackerHandController] api.reverseSwap not available');
//       showAlert('Reverse swap is currently unavailable.');
//       return;
//     }

//     try {
//       busy = true;

//       const web = await api.reverseSwap();

//       if (web) {
//         applyWeb(web);
//       }
//       // else: WS path, SSE updates
//     } catch (err) {
//       console.error('[AttackerHandController] Reverse swap failed:', err);
//       showAlert('Reverse swap failed. Try again.');
//     } finally {
//       busy = false;
//     }
//   }


//   function showAlert(message: string): void {
//     if (!overlay || !createGameAlert) {
//       alert(message);
//       return;
//     }
//     const el = createGameAlert({
//       message,
//       autoHideMs: 2500,
//       onOk: () => overlay.hide?.(),
//     });
//     overlay.show?.(el, { onHide: () => el.cleanup?.() });
//   }

//   function updateFromServerContext(web: WebGameState): void {
//     applyWeb(web);
//   }

//   async function refresh(): Promise<void> {
//     if (!api || typeof api.fetchGameState !== 'function') return;
//     const web = await api.fetchGameState().catch(() => null);
//     if (web) applyWeb(web);
//   }

//   function destroy(): void {
//     // event listener cleanup later
//   }

//   return {
//     initWithServerState,
//     updateFromServerContext,
//     refresh,
//     destroy,
//   };
// }
