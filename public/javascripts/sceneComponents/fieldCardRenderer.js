// createDefaultFieldCardRenderer.js
// sceneComponents/fieldCardRenderer.js
export function createDefaultFieldCardRenderer(assets = {}) {
  const defeatedImg = assets.defeatedImg || '/assets/images/cards/defeated.png';
  const cardBaseUrl = assets.cardBaseUrl || '/assets/images/cards/';

  function fileNameToUrl(fileName) {
    return fileName ? `${cardBaseUrl}${fileName}.png` : null;
  }

  function defendersOf(gs, pid) {
    if (!gs?.cards) return [];
    return pid === 'att'
      ? (gs.cards.attackerField || [])
      : (gs.cards.defenderField || []);
  }

  function gkOf(gs, pid) {
    if (!gs?.cards) return null;
    return pid === 'att'
      ? (gs.cards.attackerGoalkeeper || null)
      : (gs.cards.defenderGoalkeeper || null);
  }

  function createDefenderRow(player, getGameState) {
    const gs = getGameState?.();
    const slots = defendersOf(gs, player.id);

    const padded = [...slots];
    while (padded.length < 3) padded.push({ id: `pad-${padded.length}`, card: null });

    const row = document.createElement('div');
    row.className = 'defender-row';
    row.setAttribute('role', 'group');

    padded.forEach((slot, index) => {
      const el = document.createElement('div');
      el.className = 'field-card game-card';
      el.dataset.index = String(index);


      const url = fileNameToUrl(slot?.card?.fileName);
      if (url) {
        el.style.backgroundImage = `url("${url}")`;
      } else {
        el.style.backgroundImage = `url("${defeatedImg}")`;
        el.classList.add('is-defeated');
      }

      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      row.appendChild(el);
    });

    return row;
  }

  function createGoalkeeperRow(player, getGameState) {
    const gs = getGameState?.();
    const gk = gkOf(gs, player.id);

    const row = document.createElement('div');
    row.className = 'goalkeeper-row';
    row.setAttribute('role', 'group');

    const el = document.createElement('div');
    el.className = 'field-card game-card goalkeeper';
    el.dataset.index = 'g';


    const url = fileNameToUrl(gk?.fileName);
    if (url) {
      el.style.backgroundImage = `url("${url}")`;
    } else {
      el.style.backgroundImage = `url("${defeatedImg}")`;
      el.classList.add('is-defeated');
    }

    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    row.appendChild(el);
    return row;
  }

  return { createDefenderRow, createGoalkeeperRow };
}
