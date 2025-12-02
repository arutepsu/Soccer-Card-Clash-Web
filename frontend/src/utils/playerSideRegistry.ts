const STORAGE_KEYS = {
  p1: 'scc-player1-name',
  p2: 'scc-player2-name',
} as const;

export type PlayerSide = 'left' | 'right';

export interface PlayerNames {
  p1: string | null;
  p2: string | null;
}

let cache: PlayerNames | null = null;

function loadFromStorage(): PlayerNames {
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

export function setPlayers(player1Name: string, player2Name: string): void {
  cache = { p1: player1Name, p2: player2Name };
  try {
    window.localStorage.setItem(STORAGE_KEYS.p1, player1Name);
    window.localStorage.setItem(STORAGE_KEYS.p2, player2Name);
  } catch (e) {
  }
}

export function getPlayers(): PlayerNames {
  return loadFromStorage();
}

export function getSideForName(name: string | null | undefined): PlayerSide | null {
  const { p1, p2 } = loadFromStorage();
  if (!name) return null;
  if (name === p1) return 'left';
  if (name === p2) return 'right';
  return null;
}


export interface HighlightFlags {
  green: boolean;
  red: boolean;
}

export interface SideHighlights {
  left: HighlightFlags;
  right: HighlightFlags;
}

export interface SideHighlightParams {
  attacker?: { name?: string | null } | null;
  defender?: { name?: string | null } | null;
  attackerWon: boolean;
}

export function computeSideHighlights(params: SideHighlightParams): SideHighlights {
  const { attacker, defender, attackerWon } = params;

  const attackerSide = getSideForName(attacker?.name ?? null);
  const defenderSide = getSideForName(defender?.name ?? null);

  const result: SideHighlights = {
    left: { green: false, red: false },
    right: { green: false, red: false },
  };

  if (!attackerSide || !defenderSide) return result;

  if (attackerWon) {
    result[attackerSide].green = true;
    result[attackerSide].red = false;
    result[defenderSide].green = false;
    result[defenderSide].red = true;
  } else {
    result[attackerSide].green = false;
    result[attackerSide].red = true;
    result[defenderSide].green = true;
    result[defenderSide].red = false;
  }

  return result;
}
