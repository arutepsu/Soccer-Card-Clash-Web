// playerSidesRegistry.js

const STORAGE_KEYS = {
  p1: 'scc-player1-name',
  p2: 'scc-player2-name',
};

let cache = null;

function loadFromStorage() {
  if (cache) return cache;
  try {
    const p1 = window.localStorage.getItem(STORAGE_KEYS.p1);
    const p2 = window.localStorage.getItem(STORAGE_KEYS.p2);
    cache = { p1, p2 };
  } catch (e) {
    cache = { p1: null, p2: null };
  }
  return cache;
}

export function setPlayers(player1Name, player2Name) {
  cache = { p1: player1Name, p2: player2Name };
  try {
    window.localStorage.setItem(STORAGE_KEYS.p1, player1Name);
    window.localStorage.setItem(STORAGE_KEYS.p2, player2Name);
  } catch (e) {
    // ignore storage errors
  }
}

export function getPlayers() {
  return loadFromStorage();
}

export function getSideForName(name) {
  const { p1, p2 } = loadFromStorage();
  if (!name) return null;
  if (name === p1) return 'left';
  if (name === p2) return 'right';
  return null;
}

/**
 * Convenience: given attacker/defender objects ({ name }),
 * and boolean attackerWon, return highlight flags for each side.
 */
export function computeSideHighlights({ attacker, defender, attackerWon }) {
  const attackerSide = getSideForName(attacker?.name);
  const defenderSide = getSideForName(defender?.name);

  const result = {
    left:  { green: false, red: false },
    right: { green: false, red: false },
  };

  if (!attackerSide || !defenderSide) return result;

  if (attackerWon) {
    // attacker side green, defender side red
    result[attackerSide].green  = true;
    result[attackerSide].red    = false;
    result[defenderSide].green  = false;
    result[defenderSide].red    = true;
  } else {
    // attacker loses -> attacker red, defender green
    result[attackerSide].green  = false;
    result[attackerSide].red    = true;
    result[defenderSide].green  = true;
    result[defenderSide].red    = false;
  }

  return result;
}
