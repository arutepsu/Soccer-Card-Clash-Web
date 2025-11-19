export function buildSceneViewFromWeb(web, registry) {
  const attacker = {
    id: 'att',
    name: web.roles?.attacker,
    score: web.scores?.attacker,
    playerType: 'Human',
    actionStates: web.allowed?.attacker
  };
  const defender = {
    id: 'def',
    name: web.roles?.defender,
    score: web.scores?.defender,
    playerType: 'Human',
    actionStates: web.allowed?.defender
  };

  const toImg = (f) => registry.getImageForCard(f);
  const back  = registry.getImageUrl('flippedCard.png');

  const mapHand = (list = []) => list.map((c, i, arr) => {
    const isLast = i === arr.length - 1;
    const front  = toImg(c?.fileName);
    return { imgFront: front, imgBack: back, img: isLast ? front : back };
  });

  const mapField = (list = []) => list.map(slot => ({ img: toImg(slot?.card?.fileName) }));

  return {
    players: { attacker, defender },
    cards: {
      attackerHand: web.cards?.attackerHand,
      defenderHand: web.cards?.defenderHand,
      attackerField: web.cards?.attackerField,
      defenderField: web.cards?.defenderField,
      attackerGoalkeeper: web.cards?.attackerGoalkeeper,
      defenderGoalkeeper: web.cards?.defenderGoalkeeper
    },
    gameCards: {
      hands: {
        att: mapHand(web.cards?.attackerHand),
        def: mapHand(web.cards?.defenderHand),
      },
      fields: {
        att: mapField(web.cards?.attackerField),
        def: mapField(web.cards?.defenderField),
      },
      goalkeepers: {
        att: toImg(web.cards?.attackerGoalkeeper?.fileName),
        def: toImg(web.cards?.defenderGoalkeeper?.fileName),
      }
    },
    allowed: web.allowed
  };

}

export function assignAvatarsFrom(registry, web) {
  const attackerRef = { id: 'att', name: web.roles?.attacker, playerType: 'Human' };
  const defenderRef = { id: 'def', name: web.roles?.defender, playerType: 'Human' };
  registry.assignAvatarsInOrder([attackerRef, defenderRef]);
}