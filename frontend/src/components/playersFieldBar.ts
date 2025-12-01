
export interface PlayerRef {
  id: string;
  name: string;
}

export interface GameStateLike {
  [key: string]: any;
}

export interface FieldSelectionOptions {
  selectedIndex: number | null;
  onSelect: (idx: number) => void;
  selectable: boolean;
  isGoalkeeperSelected: boolean;
}

export interface FieldRendererCompat {
  createDefenderRow(
    player: PlayerRef,
    getGameState: () => GameStateLike,
    opts?: FieldSelectionOptions,
  ): HTMLElement;

  createGoalkeeperRow(
    player: PlayerRef,
    getGameState: () => GameStateLike,
    opts?: FieldSelectionOptions,
  ): HTMLElement;
}

export interface PlayersFieldBar {
  mount(el: HTMLElement | string): void;
  updateBar(gameState: GameStateLike): void;
  selectedDefenderIndex(): number | null;
  isGoalkeeperSelected(): boolean;
  resetSelectedDefender(): void;
}

export function createPlayersFieldBar(
  player: PlayerRef,
  getGameState: () => GameStateLike,
  renderer: FieldRendererCompat,
): PlayersFieldBar {
  let root: HTMLElement | null = null;
  let defenderRow: HTMLElement | null = null;
  let goalieRow: HTMLElement | null = null;

  let selectedIndex: number | null = null;
  let goalkeeperSelected = false;

  let prevSig: string | null = null;

  function fieldSig(gs: GameStateLike, pid: string): string {
    const def =
      (pid === 'att'
        ? gs?.cards?.attackerField
        : gs?.cards?.defenderField) ?? [];
    const gk =
      (pid === 'att'
        ? gs?.cards?.attackerGoalkeeper
        : gs?.cards?.defenderGoalkeeper) ?? null;

    const three = [...def].slice(0, 3);
    while (three.length < 3) three.push({ card: null });

    const defPart = three
      .map((s: any) => s?.card?.fileName ?? '')
      .join('|');
    const gkPart = gk?.fileName ?? '';
    return `${defPart}#${gkPart}`;
  }

  function labelElement(name: string): HTMLElement {
    const div = document.createElement('div');
    div.className = 'player-label';
    div.textContent = `${name}'s Field`;
    return div;
  }

  function setSelection(index: number | null): void {
    if (selectedIndex === index) {
      selectedIndex = null;
      goalkeeperSelected = false;
    } else {
      selectedIndex = index;
      goalkeeperSelected = index === -1;
    }
    applySelectionClasses(defenderRow);
    applySelectionClasses(goalieRow);
  }

  function selectionOpts(): FieldSelectionOptions {
    return {
      selectedIndex,
      onSelect: (idx) => setSelection(idx),
      selectable: true,
      isGoalkeeperSelected: goalkeeperSelected,
    };
  }

  function buildDefenderRow(gs: GameStateLike): HTMLElement {
    if (renderer.createDefenderRow.length >= 3) {
      return renderer.createDefenderRow(player, () => gs, selectionOpts());
    }
    const row = renderer.createDefenderRow(player, () => gs);
    wireSelectable(row);
    applySelectionClasses(row);
    return row;
  }

  function buildGoalkeeperRow(gs: GameStateLike): HTMLElement {
    if (renderer.createGoalkeeperRow.length >= 3) {
      return renderer.createGoalkeeperRow(player, () => gs, selectionOpts());
    }
    const row = renderer.createGoalkeeperRow(player, () => gs);
    wireSelectable(row);
    applySelectionClasses(row);
    return row;
  }

  function wireSelectable(row: HTMLElement | null): void {
    if (!row) return;

    row.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => {
      const idx = Number(el.dataset.index);
      if (Number.isNaN(idx)) return;

      el.style.cursor = 'pointer';

      const clone = el.cloneNode(true) as HTMLElement;
      el.replaceWith(clone);
    });

    row.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => {
      const idx = Number(el.dataset.index);
      if (Number.isNaN(idx)) return;

      el.addEventListener('click', () => setSelection(idx));

      el.addEventListener('keydown', (e: KeyboardEvent) => {
        const key = e.key;
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          setSelection(idx);
        }
      });

      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-pressed', String(selectedIndex === idx));
    });
  }

  function applySelectionClasses(row: HTMLElement | null): void {
    if (!row) return;

    row.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => {
      const idx = Number(el.dataset.index);
      if (Number.isNaN(idx)) return;

      if (selectedIndex === idx) {
        el.classList.add('is-selected');
        el.setAttribute('aria-pressed', 'true');
      } else {
        el.classList.remove('is-selected');
        el.setAttribute('aria-pressed', 'false');
      }
    });
  }

  function updateRows(gameState: GameStateLike): void {
    if (!root) return;

    const newDef = buildDefenderRow(gameState);
    const newGk = buildGoalkeeperRow(gameState);

    const existingLabel =
      root.querySelector<HTMLElement>('.player-label') ??
      labelElement(player.name);

    root.replaceChildren(existingLabel, newDef, newGk);

    defenderRow = newDef;
    goalieRow = newGk;

    applySelectionClasses(defenderRow);
    applySelectionClasses(goalieRow);
  }

  function mount(el: HTMLElement | string): void {
    if (el instanceof HTMLElement) {
      root = el;
    } else {
      root = document.querySelector<HTMLElement>(el);
    }
    if (!root) return;

    root.classList.add('players-field-bar');

    const gs = getGameState();
    defenderRow = buildDefenderRow(gs);
    goalieRow = buildGoalkeeperRow(gs);

    root.replaceChildren(
      labelElement(player.name),
      defenderRow,
      goalieRow,
    );
    prevSig = fieldSig(gs, player.id);
  }

  function updateBar(gameState: GameStateLike): void {
    const next = fieldSig(gameState, player.id);
    if (prevSig === next) {
      applySelectionClasses(defenderRow);
      applySelectionClasses(goalieRow);
      return;
    }
    prevSig = next;
    updateRows(gameState);
  }

  function selectedDefenderIndex(): number | null {
    return selectedIndex;
  }

  function isGoalkeeperSelected(): boolean {
    return goalkeeperSelected;
  }

  function resetSelectedDefender(): void {
    selectedIndex = null;
    goalkeeperSelected = false;
    applySelectionClasses(defenderRow);
    applySelectionClasses(goalieRow);
  }

  return {
    mount,
    updateBar,
    selectedDefenderIndex,
    isGoalkeeperSelected,
    resetSelectedDefender,
  };
}
