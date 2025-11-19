import { extractComparisonEvents } from './comparisonEvents.js';

function valueFromFileName(card) {
  const fn = card?.fileName;
  if (!fn) return null;
  const valueStr = fn.split('_of_')[0];

  const faces = {
    jack: 11,
    queen: 12,
    king: 13,
    ace: 14,
  };

  const n = parseInt(valueStr, 10);
  if (!Number.isNaN(n)) return n;
  return faces[valueStr] ?? null;
}

function isSingleTie(atkCard, defCard) {
  const av = valueFromFileName(atkCard);
  const dv = valueFromFileName(defCard);
  return av != null && dv != null && av === dv;
}

function isDoubleTie(atk1, atk2, def) {
  const v1 = valueFromFileName(atk1);
  const v2 = valueFromFileName(atk2);
  const vd = valueFromFileName(def);
  if (v1 == null || v2 == null || vd == null) return false;
  return v1 + v2 === vd;
}

export function createComparisonOrchestrator({
  api,
  overlay,
  scheduler,
  comparisonHandler,
  ActionNames,
  getRoles,
  applyUiFromWeb,
  updateFromServerContext,
  generator,
  soundManager,  
}) {
    let pendingActionType = null;
    let isOverlayActive   = false;
    let latestStreamWeb   = null;

    let lastStableWeb     = null;
    let preActionWeb      = null;

let currentComparison = null;


    function setPendingAction(type) {
    pendingActionType = type;
    preActionWeb = lastStableWeb;
    currentComparison = null;
    }
  function getAttackAndDefendCardsFromState(web, meta) {
    if (!web?.cards) {
      return {
        atkCard: null,
        defCard: null,
        extraAtkCardTie: null,
        extraDefCardTie: null,
        atkCard1Double: null,
        atkCard2Double: null,
        defCard1Double: null,
        defCard2Double: null,
      };
    }

    const cards = web.cards;

    const attHand = Array.isArray(cards.attackerHand) ? cards.attackerHand : [];
    const defHand = Array.isArray(cards.defenderHand) ? cards.defenderHand : [];
    const defField = Array.isArray(cards.defenderField) ? cards.defenderField : [];

    const last = (arr) => (arr.length > 0 ? arr[arr.length - 1] : null);
    const secondLast = (arr) => (arr.length > 1 ? arr[arr.length - 2] : null);

    const attLast  = last(attHand);
    const attPrev  = secondLast(attHand);

    const dSlot = Number.isInteger(meta?.defenderIndex) ? defField[meta.defenderIndex] : null;
    const defFieldCard = dSlot?.card ?? dSlot ?? null;

    const defHandLast  = last(defHand);
    const defHandPrev  = secondLast(defHand);

    function toCard(raw) {
      if (!raw) return null;
      const f =
        raw.fileName ||
        raw.card?.fileName ||
        raw.id ||
        null;

      return f ? { fileName: f } : null;
    }

    const atkCard = toCard(attLast);
    const defCard = toCard(defFieldCard);

    const extraAtkCardTie = toCard(attPrev);
    const extraDefCardTie = toCard(defHandLast);

    const atkCard1Double = toCard(attPrev);
    const atkCard2Double = toCard(attLast);
    const defCard1Double = toCard(defHandPrev);
    const defCard2Double = toCard(defHandLast);

    return {
      atkCard,
      defCard,
      extraAtkCardTie,
      extraDefCardTie,
      atkCard1Double,
      atkCard2Double,
      defCard1Double,
      defCard2Double,
    };
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
    currentComparison = null;

    const cmp = extractComparisonEvents(serverWeb);
    console.log('[CMP] afterServerApply action=', meta?.action, 'defIdx=', meta?.defenderIndex, 'extracted=', cmp.map(e=>e.type));

    if (cmp.length) {
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
      const source = preActionWeb || serverWeb;
      const {
        atkCard,
        defCard,
        extraAtkCardTie,
        extraDefCardTie,
      } = getAttackAndDefendCardsFromState(source, meta);

      console.log('[CMP] synth from PRE-ACTION state (end-of-queue):', {
        atkCard,
        defCard,
        extraAtkCardTie,
        extraDefCardTie,
      });

      if (atkCard && defCard) {
        const tie = isSingleTie(atkCard, defCard);

        currentComparison = { atkCard, defCard, success: !tie };

        comparisonHandler.handleComparisonEvent({
          type: 'ComparedCardsEvent',
          attackingCard: atkCard,
          defendingCard: defCard,
        });

        if (tie && extraAtkCardTie && extraDefCardTie) {
          comparisonHandler.handleComparisonEvent({
            type: 'TieComparisonEvent',
            attackingCard: atkCard,
            defendingCard: defCard,
            extraAttackerCard: extraAtkCardTie,
            extraDefenderCard: extraDefCardTie,
          });
          console.log('[CMP] synthesized TieComparisonEvent (client-side)');
        }

        comparisonHandler.handleComparisonEvent({
          type: 'AttackResultEvent',
          attackSuccess: !tie,
        });
      } else {
        console.warn('[CMP] could not derive cards from PRE-ACTION state', {
          preActionWeb,
          meta,
        });
      }
    } else if (meta?.action === 'DoubleAttack' && Number.isInteger(meta?.defenderIndex)) {
      const source = preActionWeb || serverWeb;
      const {
        atkCard1Double,
        atkCard2Double,
        defCard,
        extraAtkCardTie,
        extraDefCardTie,
      } = getAttackAndDefendCardsFromState(source, meta);

      console.log('[CMP] synth DOUBLE from PRE-ACTION state (last 2 cards):', {
        atkCard1Double,
        atkCard2Double,
        defCard,
        extraAtkCardTie,
        extraDefCardTie,
      });

      if (atkCard1Double && atkCard2Double && defCard) {
        const tie = isDoubleTie(atkCard1Double, atkCard2Double, defCard);

        currentComparison = { atkCard: atkCard2Double, defCard, success: !tie };

        comparisonHandler.handleComparisonEvent({
          type: 'DoubleComparedCardsEvent',
          attackingCard1: atkCard1Double,
          attackingCard2: atkCard2Double,
          defendingCard: defCard,
        });

        if (tie && extraAtkCardTie && extraDefCardTie) {
          comparisonHandler.handleComparisonEvent({
            type: 'DoubleTieComparisonEvent',
            attackingCard1: atkCard1Double,
            attackingCard2: atkCard2Double,
            defendingCard: defCard,
            extraAttackerCard: extraAtkCardTie,
            extraDefenderCard: extraDefCardTie,
          });
          console.log('[CMP] synthesized DoubleTieComparisonEvent (client-side)');
        }

        comparisonHandler.handleComparisonEvent({
          type: 'AttackResultEvent',
          attackSuccess: !tie,
        });
      } else {
        console.warn('[CMP] could not derive DOUBLE cards from PRE-ACTION state', {
          preActionWeb,
          meta,
        });
      }
    }



    runOverlayForPendingAction();
    }


  function handleStreamWeb(web) {
    const events = extractComparisonEvents(web);

    if (pendingActionType) {
      for (const ev of events) {
        comparisonHandler.handleComparisonEvent(ev);
      }
    }

    if (pendingActionType || isOverlayActive) {
      latestStreamWeb = web;
      return;
    }

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
