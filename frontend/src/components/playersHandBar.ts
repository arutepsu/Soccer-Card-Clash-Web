import type { GameStateLike } from '../scenes/playingField/playingFieldTypes';
import type { WebGameState, PlayerLike } from '../types/WebGameState';


export type PlayerRef = PlayerLike;
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

  selectedHandIndex(): number | null;
  resetSelectedHand(): void;
}

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------

function resolveState(
  getOrState: GameStateLike | (() => GameStateLike),
): GameStateLike {
  return typeof getOrState === 'function'
    ? (getOrState as () => GameStateLike)()
    : (getOrState as GameStateLike);
}
type CardStateLike = {
  cards?: {
    hands?: Record<string, any[]>;
    attackerHand?: any[];
    defenderHand?: any[];
    [key: string]: unknown;
  };
  gameCards?: {
    hands?: Record<string, any[]>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function handsOf(
  gs: GameStateLike | null | undefined,
  pid: string,
): any[] {
  if (!gs) return [];

  const s = gs as unknown as CardStateLike;

  const fromHands =
    s.cards?.hands?.[pid] ?? s.gameCards?.hands?.[pid];

  if (fromHands) return fromHands;

  if (pid === 'att') return s.cards?.attackerHand ?? [];
  if (pid === 'def') return s.cards?.defenderHand ?? [];

  return [];
}

function handSig(
  gs: GameStateLike | null | undefined,
  pid: string,
): string {
  if (!gs) return '';

  const s = gs as unknown as CardStateLike;

  if (pid === 'att') {
    return (s.cards?.attackerHand ?? [])
      .map((c: any) => c?.fileName ?? '')
      .join('|');
  }

  if (pid === 'def') {
    return (s.cards?.defenderHand ?? [])
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

  // selection state
  let selectedIndex: number | null = null;

  function applySelectionClasses(row: HTMLElement | null): void {
    if (!row) return;
    row.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => {
      const idx = Number(el.dataset.index);
      if (Number.isNaN(idx)) return;

      const isSelected = selectedIndex === idx;
      el.classList.toggle('is-selected', isSelected);
      el.setAttribute('aria-selected', String(isSelected));
    });
  }

  function setSelectedIndex(next: number | null): void {
    // toggle selection if same index clicked
    selectedIndex = selectedIndex === next ? null : next;
    applySelectionClasses(currentRow);
  }

  function wireSelectable(row: HTMLElement | null): void {
    if (!row) return;

    // remove old listeners by cloning nodes
    row.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => {
      const idx = Number(el.dataset.index);
      if (Number.isNaN(idx)) return;

      el.style.cursor = 'pointer';

      const clone = el.cloneNode(true) as HTMLElement;
      el.replaceWith(clone);
    });

    // attach fresh listeners
    row.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => {
      const idx = Number(el.dataset.index);
      if (Number.isNaN(idx)) return;

      el.addEventListener('click', () => setSelectedIndex(idx));

      el.addEventListener('keydown', (e: KeyboardEvent) => {
        const key = e.key;
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          setSelectedIndex(idx);
        }
      });

      el.setAttribute('role', 'option');
      el.setAttribute('tabindex', '0');
      el.setAttribute(
        'aria-selected',
        String(selectedIndex === idx),
      );
    });

    applySelectionClasses(row);
  }

  function afterRowInserted(row: HTMLElement): void {
    try {
      const gs = resolveState(getState);
      const size = handsOf(gs, player.id).length;
      renderer.applyOverlapSpacing(row, size);
      prevSig = handSig(gs, player.id);
    } catch {
      // ignore spacing errors
    }

    wireSelectable(row);

    // simple fade-in animation
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

  function updateBar(
    newGameState: GameStateLike | (() => GameStateLike),
  ): void {
    getState =
      typeof newGameState === 'function'
        ? (newGameState as () => GameStateLike)
        : () => newGameState as GameStateLike;

    const gs = resolveState(getState);
    const next = handSig(gs, player.id);
    if (prevSig === next) {
      // cards identical → keep current DOM and just reapply selection
      applySelectionClasses(currentRow);
      return;
    }

    // little “shake / slide” animation before rerender
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
        // ignore animation errors
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

  function selectedHandIndex(): number | null {
    return selectedIndex;
  }

  function resetSelectedHand(): void {
    selectedIndex = null;
    applySelectionClasses(currentRow);
  }

  return {
    mount,
    updateBar,
    selectedHandIndex,
    resetSelectedHand,
  };
}
