// // comparisonDialogHandler.js
// // Mirrors the Scala ComparisonDialogHandler in a framework-free way.

// import { UIActionScheduler, delayed } from './uiActionScheduler.js';
// // You’ll provide these functions in another script, same signatures as Scala version:
// //   showSingleComparison(attacker, defender, cA, cD, success, width)
// //   showDoubleComparison(attacker, defender, c1, c2, cD, success, width)
// //   showTieComparison(attacker, defender, cA, cD, extraA, extraD, width)
// //   showDoubleTieComparison(attacker, defender, c1, c2, cD, extraA, extraD, width)
// import * as ComparisonDialogGenerator from './comparisonDialogGenerator.js';

// /**
//  * @param {object} deps
//  * @param {{ get: () => any }} deps.contextHolder    // must return an object with .state.roles.{attacker,defender}
//  * @param {{ show: (content:any, autoHide?:boolean)=>void, getPane?:()=>HTMLElement, root?:HTMLElement }} deps.overlay
//  * @param {any} [deps.controller] // kept for parity; not used directly here
//  */
// export function createComparisonDialogHandler({ controller, contextHolder, overlay, overlayHost }) {
//   // ---- last-seen comparison state (Scala: private vars) ----
//   let lastAttackingCard      = undefined;
//   let lastAttackingCard1     = undefined;
//   let lastAttackingCard2     = undefined;
//   let lastDefendingCard      = undefined;
//   let lastExtraAttackerCard  = undefined;
//   let lastExtraDefenderCard  = undefined;
//   let lastAttackSuccess      = undefined;

//   const scheduler = new UIActionScheduler();

//   function overlayWidth() {
//     // Scala used: overlay.getPane.getWidth
//     const pane = overlay?.getPane?.() || overlay?.root;
//     return pane ? (pane.clientWidth || pane.offsetWidth || 0) : 0;
//   }

//   function roles() {
//     const st = contextHolder?.get?.() || contextHolder;
//     const attacker = st?.state?.roles?.attacker ?? st?.roles?.attacker ?? 'Attacker';
//     const defender = st?.state?.roles?.defender ?? st?.roles?.defender ?? 'Defender';
//     return { attacker, defender };
//   }

//   // ---- translate a GameActionEvent -> UIAction (or null) ----
//   /**
//    * @param {{ type:string }} actionEvent
//    * @returns {{ delay:number, block:()=>void } | null}
//    */
//   function createOverlayAction(actionEvent) {
//     const { attacker, defender } = roles();
//     const width = overlayWidth();

//     switch (actionEvent?.type) {
//       case 'RegularAttack': {
//         if (lastAttackingCard && lastDefendingCard && typeof lastAttackSuccess === 'boolean') {
//           return delayed(0, () => {
//             overlay.show(
//               ComparisonDialogGenerator.showSingleComparison(
//                 attacker, defender, lastAttackingCard, lastDefendingCard, lastAttackSuccess, width
//               ),
//               true
//             );
//           });
//         }
//         return null;
//       }

//       case 'DoubleAttack': {
//         if (lastAttackingCard1 && lastAttackingCard2 && lastDefendingCard && typeof lastAttackSuccess === 'boolean') {
//           return delayed(0, () => {
//             overlay.show(
//               ComparisonDialogGenerator.showDoubleComparison(
//                 attacker, defender, lastAttackingCard1, lastAttackingCard2, lastDefendingCard, lastAttackSuccess, width
//               ),
//               true
//             );
//           });
//         }
//         return null;
//       }

//       case 'TieComparison': {
//         if (lastAttackingCard && lastDefendingCard && lastExtraAttackerCard && lastExtraDefenderCard) {
//           return delayed(0, () => {
//             overlay.show(
//               ComparisonDialogGenerator.showTieComparison(
//                 attacker, defender, lastAttackingCard, lastDefendingCard,
//                 lastExtraAttackerCard, lastExtraDefenderCard, width
//               ),
//               true
//             );
//           });
//         }
//         return null;
//       }

//       case 'DoubleTieComparison': {
//         if (lastAttackingCard1 && lastAttackingCard2 && lastDefendingCard &&
//             lastExtraAttackerCard && lastExtraDefenderCard) {
//           return delayed(0, () => {
//             overlay.show(
//               ComparisonDialogGenerator.showDoubleTieComparison(
//                 attacker, defender,
//                 lastAttackingCard1, lastAttackingCard2, lastDefendingCard,
//                 lastExtraAttackerCard, lastExtraDefenderCard, width
//               ),
//               true
//             );
//           });
//         }
//         return null;
//       }

//       default:
//         return null;
//     }
//   }

//   // ---- feed state events into the handler (Scala: handleComparisonEvent) ----
//   /**
//    * Accepts state events coming from your bus/controller and caches data.
//    * Event type strings mirror Scala case names.
//    *
//    * Supported:
//    *  - ComparedCardsEvent          { type, attackingCard?, defendingCard? }
//    *  - DoubleComparedCardsEvent    { type, attackingCard1?, attackingCard2?, defendingCard? }
//    *  - AttackResultEvent           { type, attacker?, defender?, attackSuccess:boolean }
//    *  - TieComparisonEvent          { type, attackingCard?, defendingCard?, extraAttackerCard?, extraDefenderCard? }
//    *  - DoubleTieComparisonEvent    { type, attackingCard1?, attackingCard2?, defendingCard?, extraAttackerCard?, extraDefenderCard? }
//    */
//   function handleComparisonEvent(e) {
//     switch (e?.type) {
//       case 'ComparedCardsEvent':
//         if (e.attackingCard && e.defendingCard) {
//           lastAttackingCard = e.attackingCard;
//           lastDefendingCard = e.defendingCard;
//           // console.log(lastAttackingCard, lastDefendingCard);
//         }
//         break;

//       case 'DoubleComparedCardsEvent':
//         if (e.attackingCard1 && e.attackingCard2 && e.defendingCard) {
//           lastAttackingCard1 = e.attackingCard1;
//           lastAttackingCard2 = e.attackingCard2;
//           lastDefendingCard  = e.defendingCard;
//         }
//         break;

//       case 'AttackResultEvent':
//         if (typeof e.attackSuccess === 'boolean') {
//           lastAttackSuccess = e.attackSuccess;
//           // console.log('attack success?', lastAttackSuccess);
//         }
//         break;

//       case 'TieComparisonEvent':
//         if (e.attackingCard && e.defendingCard && e.extraAttackerCard && e.extraDefenderCard) {
//           lastAttackingCard     = e.attackingCard;
//           lastDefendingCard     = e.defendingCard;
//           lastExtraAttackerCard = e.extraAttackerCard;
//           lastExtraDefenderCard = e.extraDefenderCard;
//         }
//         break;

//       case 'DoubleTieComparisonEvent':
//         if (e.attackingCard1 && e.attackingCard2 && e.defendingCard &&
//             e.extraAttackerCard && e.extraDefenderCard) {
//           lastAttackingCard1    = e.attackingCard1;
//           lastAttackingCard2    = e.attackingCard2;
//           lastDefendingCard     = e.defendingCard;
//           lastExtraAttackerCard = e.extraAttackerCard;
//           lastExtraDefenderCard = e.extraDefenderCard;
//         }
//         break;

//       default:
//         // ignore others
//         break;
//     }
//   }

//   // ---- reset cache (Scala: resetLastCards) ----
//   function resetLastCards() {
//     lastAttackingCard      = undefined;
//     lastAttackingCard1     = undefined;
//     lastAttackingCard2     = undefined;
//     lastDefendingCard      = undefined;
//     lastExtraAttackerCard  = undefined;
//     lastExtraDefenderCard  = undefined;
//     lastAttackSuccess      = undefined;
//   }

//   // convenience: schedule an overlay for a GameActionEvent now (returns a cancel handle)
//   function runOverlayFor(actionEvent) {
//     const action = createOverlayAction(actionEvent);
//     return action ? scheduler.runSequence(action) : { cancel(){} };
//   }

//   return {
//     // parity with Scala
//     createOverlayAction,
//     handleComparisonEvent,
//     resetLastCards,

//     // JS-friendly extras
//     runOverlayFor,
//     get debug() {
//       return {
//         lastAttackingCard, lastAttackingCard1, lastAttackingCard2,
//         lastDefendingCard, lastExtraAttackerCard, lastExtraDefenderCard,
//         lastAttackSuccess
//       };
//     }
//   };
//   function safeShow(node, autoHide = true) {
//     // prefer the DOM host helper your app already uses
//     if (overlayHost && typeof overlayHost.__showOverlay === 'function') {
//       overlayHost.__showOverlay(node, { autoHide });
//       return;
//     }
//     // then try the overlay instance
//     if (overlay && typeof overlay.show === 'function') {
//       overlay.show(node, autoHide);
//       return;
//     }
//     // last-resort: mount into host and unhide
//     const host = overlayHost || document.getElementById('overlay');
//     if (host) {
//       const scroll = host.querySelector('.overlay-scroll') || host;
//       if (scroll) scroll.innerHTML = ''; // clear
//       (scroll || host).appendChild(node);
//       host.classList?.remove?.('hidden');
//       host.setAttribute?.('aria-hidden', 'false');
//     }
//   }
// }
// /assets/javascripts/utils/comparisonDialogHandler.js
// comparisonDialogHandler.js
// comparisonDialogHandler.js
import { UIActionScheduler, delayed } from './uiActionScheduler.js';

export function createComparisonDialogHandler({
  controller,
  contextHolder,
  overlay,      // 🔥 single overlay instance for the whole app
  onAutoClose,  // scene will refresh game state
  generator,    // injected ComparisonDialogGenerator (already configured)
}) {
  let lastAttackingCard,
      lastAttackingCard1,
      lastAttackingCard2,
      lastDefendingCard,
      lastExtraAttackerCard,
      lastExtraDefenderCard,
      lastAttackSuccess;

  const scheduler   = new UIActionScheduler();
  const autoCloseMs = 3000;

  function overlayWidth() {
    // no DOM host dependency anymore – just use window
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const min = 800;
    const max = 1600;
    return Math.max(min, Math.min(w || 1200, max));
  }

  function roles() {
    const st = contextHolder?.get?.() || contextHolder;
    const a = st?.state?.roles?.attacker ?? st?.roles?.attacker ?? 'Attacker';
    const d = st?.state?.roles?.defender ?? st?.roles?.defender ?? 'Defender';
    return {
      attacker: { id: 'att', name: a, playerType: 'Human' },
      defender: { id: 'def', name: d, playerType: 'Human' }
    };
  }

  // ----- overlay helpers: only use the shared overlay -----
  function safeShow(node) {
    if (!overlay || !overlay.show) {
      console.warn('[overlay] missing overlay instance for comparison dialog');
      return;
    }
    overlay.show(node, { autoHide: false });
  }

  function safeHide() {
    if (!overlay || !overlay.hide) return;
    overlay.hide();
  }

  function showThenAutoClose(node) {
    safeShow(node);
    setTimeout(() => {
      safeHide();
      onAutoClose?.();
    }, autoCloseMs);
  }

  // --- core: turn an action into a delayed overlay block ---
  function createOverlayAction(actionEvent) {
    const { attacker, defender } = roles();
    const width = overlayWidth();

    const gen = generator;
    if (!gen) {
      console.warn('[CMP] comparisonDialogHandler: no generator provided');
      return null;
    }

    switch (actionEvent?.type) {
      case 'RegularAttack': {
        if (lastAttackingCard && lastDefendingCard && typeof lastAttackSuccess === 'boolean') {
          return delayed(0, () => {
            const content = gen.showSingleComparison(
              attacker,
              defender,
              lastAttackingCard,
              lastDefendingCard,
              lastAttackSuccess,
              width
            );
            showThenAutoClose(content);
          });
        }
        return null;
      }

      // TODO: add DoubleAttack, Tie, DoubleTie mappings later
      default:
        return null;
    }
  }

  // --- event intake from server/state ---
  function handleComparisonEvent(e) {
    switch (e?.type) {
      case 'ComparedCardsEvent':
        if (e.attackingCard && e.defendingCard) {
          lastAttackingCard  = e.attackingCard;
          lastDefendingCard  = e.defendingCard;
        }
        break;

      case 'AttackResultEvent':
        if (typeof e.attackSuccess === 'boolean') {
          lastAttackSuccess = e.attackSuccess;
        }
        break;

      // (double/tie cases can be added here later)
    }
  }

  function resetLastCards() {
    lastAttackingCard =
      lastAttackingCard1 =
      lastAttackingCard2 =
      lastDefendingCard =
      lastExtraAttackerCard =
      lastExtraDefenderCard =
      lastAttackSuccess =
        undefined;
  }

  function runOverlayFor(actionEvent) {
    const a = createOverlayAction(actionEvent);
    return a ? scheduler.runSequence(a) : { cancel() {} };
  }

  return {
    createOverlayAction,
    handleComparisonEvent,
    resetLastCards,
    runOverlayFor,
    debug: {
      get lastAttackingCard()      { return lastAttackingCard; },
      get lastDefendingCard()      { return lastDefendingCard; },
      get lastAttackSuccess()      { return lastAttackSuccess; },
      get lastExtraAttackerCard()  { return lastExtraAttackerCard; },
      get lastExtraDefenderCard()  { return lastExtraDefenderCard; },
    },
  };
}
