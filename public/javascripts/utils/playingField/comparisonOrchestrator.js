import { extractComparisonEvents } from './comparisonEvents.js';

export function createComparisonOrchestrator({
  api,
  overlay,
  scheduler,
  comparisonHandler,
  ActionNames,
  getRoles,                 // () => ({ attacker, defender })
  applyUiFromWeb,           // (web) => void
  updateFromServerContext,  // (web) => void
  generator,                // ComparisonDialogGenerator
  soundManager,  
}) {
    let pendingActionType = null;
    let isOverlayActive   = false;
    let latestStreamWeb   = null;

    let lastStableWeb     = null; // last normal game state from stream
    let preActionWeb      = null; // snapshot taken when user clicks action

let currentComparison = null; // { atkCard, defCard, success }


    function setPendingAction(type) {
    pendingActionType = type;
    // snapshot state BEFORE we send the action to the server
    preActionWeb = lastStableWeb;
    currentComparison = null;
    }
  // game rule helper: attacker = end of queue, defender = index
    function getAttackAndDefendCardsFromState(web, meta) {
    if (!web?.cards) return { atkCard: null, defCard: null };

    const hand  = Array.isArray(web.cards.attackerHand) ? web.cards.attackerHand : [];
    const lastIdx = hand.length - 1;
    const lastHandCard = lastIdx >= 0 ? hand[lastIdx] : null;  // end-of-queue

    const field = Array.isArray(web.cards.defenderField) ? web.cards.defenderField : [];
    const dSlot = Number.isInteger(meta?.defenderIndex) ? field[meta.defenderIndex] : null;

    const atkFile =
        lastHandCard?.fileName ||
        lastHandCard?.card?.fileName ||
        null;

    const defFile =
        dSlot?.card?.fileName ||
        dSlot?.fileName ||
        null;

    const atkCard = atkFile ? { fileName: atkFile } : null;
    const defCard = defFile ? { fileName: defFile } : null;

    return { atkCard, defCard };
    }


  function runOverlayForPendingAction() {
    if (!pendingActionType) return;

    isOverlayActive = true;

    const overlayAction = comparisonHandler.createOverlayAction({ type: pendingActionType });
    console.log('[CMP] runOverlay pending=', pendingActionType, 'hasAction=', !!overlayAction);

    const delay =
      (pendingActionType === ActionNames.RegularAttack || pendingActionType === ActionNames.DoubleAttack) ? 0 :
      (pendingActionType === ActionNames.Undo || pendingActionType === ActionNames.Redo ||
       pendingActionType === ActionNames.BoostDefender || pendingActionType === ActionNames.BoostGoalkeeper ||
       pendingActionType === ActionNames.RegularSwap  || pendingActionType === ActionNames.ReverseSwap) ? 100 : 0;

    const seq = [];

    if (overlayAction) {
      // --- 1) Normal path: handler built an overlay action ---
      seq.push({
        delay: 0,
        block: () => {
          console.log('[CMP] executing overlayAction block → overlay.show()');
          overlayAction.block();
        }
      });

    } else if (
      pendingActionType === ActionNames.RegularAttack &&
      currentComparison?.atkCard &&
      currentComparison?.defCard
    ) {
      // --- 2) Pure game-rule based fallback for regular attack ---
      console.log('[CMP] fallback using currentComparison from hand-end + defenderIndex');

      seq.push({
        delay: 0,
        block: () => {
          const roles = getRoles();
          const attacker = { id: 'att', name: roles.attacker, playerType: 'Human' };
          const defender = { id: 'def', name: roles.defender, playerType: 'Human' };
          const width =
            (overlay?.getPane?.()?.clientWidth) ||
            (document.getElementById('overlay')?.clientWidth) ||
            1200;

          const { atkCard, defCard, success } = currentComparison;

          const node = generator.showSingleComparison(
            attacker,
            defender,
            atkCard,
            defCard,
            success ?? false,
            width
          );

          const host = document.getElementById('overlay');
          if (host?.__showOverlay) host.__showOverlay(node, { autoHide: false });
          else overlay?.show?.(node, { autoHide: false });

          setTimeout(() => {
            host?.__hideOverlay?.() || overlay?.hide?.();
          }, 3000);
        }
      });

    } else {
      // --- 3) ultimate debug text, no "last" cards, just info ---
      const host = document.getElementById('overlay');
      const div  = document.createElement('div');
      div.className = 'overlay-textflow';
      div.innerHTML = `
        <div class="dialog-title">Comparison (debug)</div>
        <div class="dialog-message">
          no comparison cards available for ${pendingActionType}
        </div>
        <div class="overlay-actions"><button class="gbtn" data-close-overlay>Close</button></div>`;
      host?.__showOverlay?.(div, { autoHide:false });
      console.warn('[CMP] overlayAction null; no currentComparison');
    }

    // --- 4) unified refresh AFTER overlay duration ---
    seq.push({
      delay: 3000 + delay + 150,
      block: async () => {
        try {
          soundManager.play('attack', { volume: 0.7 });
          const fresh = latestStreamWeb || await api.fetchGameState();
          latestStreamWeb = null;
          applyUiFromWeb(fresh);
          updateFromServerContext(fresh);
        } catch (e) {
          console.warn('delayed refresh failed', e);
        } finally {
          comparisonHandler.resetLastCards();
          currentComparison = null;
          pendingActionType = null;
          isOverlayActive = false;
        }
      }
    });

    scheduler.runSequence(...seq);
  }

function afterServerApply(serverWeb, meta) {
    comparisonHandler.resetLastCards();
    currentComparison = null;

    const cmp = extractComparisonEvents(serverWeb);
    console.log('[CMP] afterServerApply action=', meta?.action, 'defIdx=', meta?.defenderIndex, 'extracted=', cmp.map(e=>e.type));

    if (cmp.length) {
        // normal path: server sent comparison events
        cmp.forEach(ev => comparisonHandler.handleComparisonEvent(ev));
        if (!cmp.some(e => e.type === 'AttackResultEvent')) {
        comparisonHandler.handleComparisonEvent({ type: 'AttackResultEvent', attackSuccess: false });
        console.log('[CMP] synthesized AttackResultEvent=false (no server result)');
        }

        const cmpEvt = cmp.find(e => e.type === 'ComparedCardsEvent');
        if (cmpEvt?.attackingCard && cmpEvt?.defendingCard) {
        currentComparison = {
            atkCard: cmpEvt.attackingCard,
            defCard: cmpEvt.defendingCard,
            success: undefined,
        };
        }

    } else if (meta?.action === 'RegularAttack' && Number.isInteger(meta?.defenderIndex)) {
        const source = preActionWeb || serverWeb; // prefer preActionWeb
        const { atkCard, defCard } = getAttackAndDefendCardsFromState(source, meta);
        console.log('[CMP] synth from PRE-ACTION state (end-of-queue):', { atkCard, defCard });

        if (atkCard && defCard) {
        currentComparison = { atkCard, defCard, success: false };

        // optional: feed synthetic events to handler
        comparisonHandler.handleComparisonEvent({
            type: 'ComparedCardsEvent',
            attackingCard: atkCard,
            defendingCard: defCard,
        });
        comparisonHandler.handleComparisonEvent({
            type: 'AttackResultEvent',
            attackSuccess: false,
        });
        } else {
        console.warn('[CMP] could not derive cards from PRE-ACTION state', {
            preActionWeb,
            meta,
        });
        }
    } else {
        console.warn('[CMP] no comparison data and not a RegularAttack fallback path');
    }

    runOverlayForPendingAction();
    }


    function handleStreamWeb(web) {
    const events = extractComparisonEvents(web);
    for (const ev of events) comparisonHandler.handleComparisonEvent(ev);

    // if overlay in progress or action pending, don't touch the UI, just remember latest post-action state
    if (pendingActionType || isOverlayActive) {
        latestStreamWeb = web;
        return;
    }

    // normal flow: this becomes the "stable" state we can snapshot before actions
    lastStableWeb = web;
    applyUiFromWeb(web);
    updateFromServerContext(web);
    }


  return {
    setPendingAction,
    afterServerApply,
    handleStreamWeb,
  };
}
