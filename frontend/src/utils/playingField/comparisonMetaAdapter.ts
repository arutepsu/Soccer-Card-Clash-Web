import type { ComparisonDialogHandler } from './comparisonDialogHandler';

export type ComparisonMeta = {
  action: 'Comparison';
  payload?: {
    kind?: 'Regular' | 'Double' | 'Tie' | 'DoubleTie';
    attacker?: string;
    defender?: string;

    attackSuccess?: boolean;

    attackCards?: any[];
    defendCard?: any;

    extraAttackCard?: any;
    extraDefendCard?: any;

    defenderIndex?: number;
  };
};

export function feedComparisonMetaToHandler(
  handler: ComparisonDialogHandler,
  meta: ComparisonMeta,
): void {
  const p = meta.payload ?? {};
  const kind = String(p.kind ?? '').toLowerCase();

  const atkCards = Array.isArray(p.attackCards) ? p.attackCards : [];
  const defCard = p.defendCard ?? null;

  const extraAtk = p.extraAttackCard ?? null;
  const extraDef = p.extraDefendCard ?? null;

  const success =
    typeof p.attackSuccess === 'boolean' ? p.attackSuccess : false;

  handler.resetLastCards();

  if (kind.includes('double')) {
    const c1 = atkCards[0] ?? null;
    const c2 = atkCards[1] ?? null;

    if (c1 && c2 && defCard) {
      handler.handleComparisonEvent({
        type: 'DoubleComparedCardsEvent',
        attackingCard1: c1,
        attackingCard2: c2,
        defendingCard: defCard,
      });

      if (kind.includes('tie') && extraAtk && extraDef) {
        handler.handleComparisonEvent({
          type: 'DoubleTieComparisonEvent',
          attackingCard1: c1,
          attackingCard2: c2,
          defendingCard: defCard,
          extraAttackerCard: extraAtk,
          extraDefenderCard: extraDef,
        });
      }

      handler.handleComparisonEvent({
        type: 'AttackResultEvent',
        attackSuccess: success,
      });
    }
  } else {
    const c1 = atkCards[0] ?? null;

    if (c1 && defCard) {
      handler.handleComparisonEvent({
        type: 'ComparedCardsEvent',
        attackingCard: c1,
        defendingCard: defCard,
      });

      if (kind.includes('tie') && extraAtk && extraDef) {
        handler.handleComparisonEvent({
          type: 'TieComparisonEvent',
          attackingCard: c1,
          defendingCard: defCard,
          extraAttackerCard: extraAtk,
          extraDefenderCard: extraDef,
        });
      }

      handler.handleComparisonEvent({
        type: 'AttackResultEvent',
        attackSuccess: success,
      });
    }
  }
}


export function pendingActionFromKind(
  kindRaw: unknown,
): 'RegularAttack' | 'DoubleAttack' {
  const k = String(kindRaw ?? '').toLowerCase();
  return k.includes('double') ? 'DoubleAttack' : 'RegularAttack';
}
