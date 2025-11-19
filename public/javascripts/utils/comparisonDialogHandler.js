import { UIActionScheduler, delayed } from './uiActionScheduler.js';

export function createComparisonDialogHandler({
  controller,
  contextHolder,
  overlay, 
  onAutoClose,
  generator,
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

  function roles() {
    const st = contextHolder?.get?.() || contextHolder;
    const a = st?.state?.roles?.attacker ?? st?.roles?.attacker ?? 'Attacker';
    const d = st?.state?.roles?.defender ?? st?.roles?.defender ?? 'Defender';
    return {
      attacker: { id: 'att', name: a, playerType: 'Human' },
      defender: { id: 'def', name: d, playerType: 'Human' }
    };
  }

function safeShow(node, opts = {}) {
  if (!overlay || !overlay.show) {
    console.warn('[overlay] missing overlay instance for comparison dialog');
    return;
  }

  const { autoHide = false, sizeMult } = opts;

  overlay.show(node, {
    autoHide,
    sizeMult,
  });
}

function safeHide() {
  if (!overlay || !overlay.hide) return;
  overlay.hide();
}

function showThenAutoClose(node, opts = {}) {
  const { sizeMult } = opts;

  safeShow(node, { autoHide: false, sizeMult });

  setTimeout(() => {
    safeHide();
    onAutoClose?.();
  }, autoCloseMs);
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

  function createOverlayAction(actionEvent) {
    const { attacker, defender } = roles();

    const gen = generator;
    if (!gen) {
      console.warn('[CMP] comparisonDialogHandler: no generator provided');
      return null;
    }

    switch (actionEvent?.type) {
      case 'RegularAttack': {
        if (!lastAttackingCard || !lastDefendingCard) return null;

        const hasTieExtras = !!(lastExtraAttackerCard && lastExtraDefenderCard);

        return delayed(0, () => {
          const node = hasTieExtras
            ? gen.showTieComparison(
                attacker,
                defender,
                lastAttackingCard,
                lastDefendingCard,
                lastExtraAttackerCard,
                lastExtraDefenderCard
              )
            : gen.showSingleComparison(
                attacker,
                defender,
                lastAttackingCard,
                lastDefendingCard,
                lastAttackSuccess ?? false
              );

          showThenAutoClose(node, { sizeMult: hasTieExtras ? 1.7 : 1.7 });
        });
      }

      case 'DoubleAttack': {
        if (!lastAttackingCard1 || !lastAttackingCard2 || !lastDefendingCard) return null;

        const hasTieExtras = !!(lastExtraAttackerCard && lastExtraDefenderCard);

        return delayed(0, () => {
          const node = hasTieExtras
            ? gen.showDoubleTieComparison(
                attacker,
                defender,
                lastAttackingCard1,
                lastAttackingCard2,
                lastDefendingCard,
                lastExtraAttackerCard,
                lastExtraDefenderCard
              )
            : gen.showDoubleComparison(
                attacker,
                defender,
                lastAttackingCard1,
                lastAttackingCard2,
                lastDefendingCard,
                lastAttackSuccess ?? false
              );

          showThenAutoClose(node, { sizeMult: 1.7 });
        });
      }

      default:
        return null;
    }
  }


  function handleComparisonEvent(e) {
    switch (e?.type) {

      case "ComparedCardsEvent":
        if (e.attackingCard && e.defendingCard) {
          lastAttackingCard = e.attackingCard;
          lastDefendingCard = e.defendingCard;
        }
        break;

      case "DoubleComparedCardsEvent":
        if (e.attackingCard1 && e.attackingCard2 && e.defendingCard) {
          lastAttackingCard1 = e.attackingCard1;
          lastAttackingCard2 = e.attackingCard2;
          lastDefendingCard  = e.defendingCard;
        }
        break;

      case "AttackResultEvent":
        if (typeof e.attackSuccess === "boolean") {
          lastAttackSuccess = e.attackSuccess;
        }
        break;

      case "TieComparisonEvent":
        if (e.attackingCard && e.defendingCard && e.extraAttackerCard && e.extraDefenderCard) {
          lastAttackingCard      = e.attackingCard;
          lastDefendingCard      = e.defendingCard;
          lastExtraAttackerCard  = e.extraAttackerCard;
          lastExtraDefenderCard  = e.extraDefenderCard;
        }
        break;

      case "DoubleTieComparisonEvent":
        if (e.attackingCard1 && e.attackingCard2 && e.defendingCard &&
            e.extraAttackerCard && e.extraDefenderCard) {
          lastAttackingCard1     = e.attackingCard1;
          lastAttackingCard2     = e.attackingCard2;
          lastDefendingCard      = e.defendingCard;
          lastExtraAttackerCard  = e.extraAttackerCard;
          lastExtraDefenderCard  = e.extraDefenderCard;
        }
        break;

      default:
        break;
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
