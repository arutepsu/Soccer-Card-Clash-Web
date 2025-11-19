const isBool = (v) => typeof v === 'boolean';
const has = (o, k) => o && Object.prototype.hasOwnProperty.call(o, k);

export function extractComparisonEvents(web) {
  const out = [];
  const buckets = [
    web?.comparison,
    web?.lastComparison,
    web?.lastAttack,
    web?.cmp,
    web?.recent?.comparison,
    ...(Array.isArray(web?.events) ? web.events : []),
    ...(Array.isArray(web?.stateEvents) ? web.stateEvents : []),
    ...(Array.isArray(web?.comparisonEvents) ? web.comparisonEvents : []),
  ].filter(Boolean);

  for (const item of buckets) {
    if (item?.type === 'ComparedCardsEvent' ||
        item?.type === 'DoubleComparedCardsEvent' ||
        item?.type === 'AttackResultEvent' ||
        item?.type === 'TieComparisonEvent' ||
        item?.type === 'DoubleTieComparisonEvent') {
      out.push(item);
      continue;
    }

    const t = (item?.type || item?.kind || '').toLowerCase();

    if (t.includes('double') && t.includes('tie') &&
        item?.attackingCard1 && item?.attackingCard2 && item?.defendingCard &&
        item?.extraAttackerCard && item?.extraDefenderCard) {
      out.push({
        type: 'DoubleTieComparisonEvent',
        attackingCard1: item.attackingCard1,
        attackingCard2: item.attackingCard2,
        defendingCard: item.defendingCard,
        extraAttackerCard: item.extraAttackerCard,
        extraDefenderCard: item.extraDefenderCard,
      });

      continue;
    }

    if ((t.includes('tie') || has(item, 'extraAttackerCard') || has(item, 'extraDefenderCard')) &&
        item?.attackingCard && item?.defendingCard &&
        item?.extraAttackerCard && item?.extraDefenderCard) {
      out.push({
        type: 'TieComparisonEvent',
        attackingCard: item.attackingCard,
        defendingCard: item.defendingCard,
        extraAttackerCard: item.extraAttackerCard,
        extraDefenderCard: item.extraDefenderCard,
      });
      continue;
    }

    if ((t.includes('regular') || t.includes('single') || t === 'attack') &&
        item?.attackingCard && item?.defendingCard) {
      out.push({
        type: 'ComparedCardsEvent',
        attackingCard: item.attackingCard,
        defendingCard: item.defendingCard,
      });
      if (isBool(item?.success) || isBool(item?.attackSuccess)) {
        out.push({
          type: 'AttackResultEvent',
          attackSuccess: Boolean(item.success ?? item.attackSuccess),
        });
      }
      continue;
    }

    if (t.includes('double') &&
        item?.attackingCard1 && item?.attackingCard2 && item?.defendingCard) {
      out.push({
        type: 'DoubleComparedCardsEvent',
        attackingCard1: item.attackingCard1,
        attackingCard2: item.attackingCard2,
        defendingCard: item.defendingCard,
      });
      if (isBool(item?.success) || isBool(item?.attackSuccess)) {
        out.push({
          type: 'AttackResultEvent',
          attackSuccess: Boolean(item.success ?? item.attackSuccess),
        });
      }
      continue;
    }
  }

  return out;
}
