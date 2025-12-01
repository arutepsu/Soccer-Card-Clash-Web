export interface PlayerRef {
  id: string;
  name?: string;
}

export interface GameStateLike {
  [key: string]: any;
}

export interface HandRendererCompat {
  applyOverlapSpacing(rowEl: HTMLElement, handSize: number): void;
  createHandCardRow(
    player: PlayerRef,
    getGameState: () => GameStateLike,
  ): HTMLElement;
}

export interface PlayersHandBar {
  mount(el: HTMLElement | string): void;
  updateBar(newGameState: GameStateLike | (() => GameStateLike)): void;
  selectedCardIndex(): number | null;
}

function resolveState(getOrState: GameStateLike | (() => GameStateLike)): GameStateLike {
  return typeof getOrState === 'function'
    ? (getOrState as () => GameStateLike)()
    : (getOrState as GameStateLike);
}

function handsOf(gs: GameStateLike | null | undefined, pid: string): any[] {
  if (!gs) return [];
  const fromHands =
    gs.cards?.hands?.[pid] ?? gs.gameCards?.hands?.[pid];
  if (fromHands) return fromHands;
  if (pid === 'att') return gs.cards?.attackerHand ?? [];
  if (pid === 'def') return gs.cards?.defenderHand ?? [];
  return [];
}

function handSig(gs: GameStateLike | null | undefined, pid: string): string {
  if (!gs) return '';
  if (pid === 'att') {
    return (gs.cards?.attackerHand ?? [])
      .map((c: any) => c?.fileName ?? '')
      .join('|');
  }
  if (pid === 'def') {
    return (gs.cards?.defenderHand ?? [])
      .map((c: any) => c?.fileName ?? '')
      .join('|');
  }
  return '';
}

export function createPlayersHandBar(
  player: PlayerRef,
  initialGameState: GameStateLike | (() => GameStateLike),
  renderer: HandRendererCompat,
): PlayersHandBar {
  let root: HTMLElement | null = null;
  let currentRow: HTMLElement | null = null;

  let getState: () => GameStateLike =
    typeof initialGameState === 'function'
      ? (initialGameState as () => GameStateLike)
      : () => initialGameState as GameStateLike;

  let prevSig: string | null = null;

  function afterRowInserted(row: HTMLElement): void {
    try {
      const gs = resolveState(getState);
      const size = handsOf(gs, player.id).length;
      renderer.applyOverlapSpacing(row, size);
      prevSig = handSig(gs, player.id);
    } catch {
    }

    Array.from(row.children).forEach((node) => {
      const el = node as HTMLElement;
      el.style.opacity = '0';
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 500ms ease';
        el.style.opacity = '1';
      });
    });
  }

  function mount(el: HTMLElement | string): void {
    if (el instanceof HTMLElement) {
      root = el;
    } else {
      root = document.querySelector<HTMLElement>(el);
    }
    if (!root) return;

    currentRow = renderer.createHandCardRow(player, getState);
    root.replaceChildren(currentRow);

    if (player?.id === 'att') {
      root.classList.add('attacker-hand-bar');
    }

    root.setAttribute('role', 'region');
    root.setAttribute(
      'aria-label',
      `${player?.id === 'att' ? 'Attacker' : 'Defender'} hand`,
    );

    afterRowInserted(currentRow);
  }

  function updateBar(newGameState: GameStateLike | (() => GameStateLike)): void {
    getState =
      typeof newGameState === 'function'
        ? (newGameState as () => GameStateLike)
        : () => newGameState as GameStateLike;

    const gs = resolveState(getState);
    const next = handSig(gs, player.id);
    if (prevSig === next) return;

    Array.from(currentRow?.children ?? []).forEach((node) => {
      const el = node as HTMLElement;
      try {
        el.animate(
          [
            { transform: 'translateX(0) scale(1) rotate(0deg)' },
            { transform: 'translateX(25px) scale(1.1) rotate(8deg)' },
          ],
          {
            duration: 500,
            easing: 'cubic-bezier(.25,.8,.25,1)',
          },
        );
      } catch {
      }
    });

    setTimeout(() => {
      if (!root) return;
      const newRow = renderer.createHandCardRow(player, getState);
      root.replaceChildren(newRow);
      currentRow = newRow;
      afterRowInserted(newRow);
    }, 500);
  }

  function selectedCardIndex(): number | null {
    return null;
  }

  return { mount, updateBar, selectedCardIndex };
}
