import type { PlayerLike, WebGameState } from '../types/WebGameState';

export type GetGameState = () => WebGameState | null;

export interface FieldCardRenderer {
  createDefenderRow(
    player: PlayerLike,
    getGameState: GetGameState,
  ): HTMLElement;
  createGoalkeeperRow(
    player: PlayerLike,
    getGameState: GetGameState,
  ): HTMLElement;
}

export type SelectedTarget =
  | { kind: 'defender'; index: number }
  | { kind: 'goalkeeper' }
  | null;

export interface AttackerFieldBar {
  mount(container: HTMLElement | string): void;
  isMounted(): boolean;
  updateBar(): void;
  selectedTarget(): SelectedTarget;
  clearSelection(): void;
}

export type GetCurrentAttacker =
  | (() => PlayerLike | null | undefined)
  | PlayerLike;

export function createAttackerFieldBar(
  getCurrentAttacker: GetCurrentAttacker,
  getGameState: GetGameState,
  fieldRenderer: FieldCardRenderer,
): AttackerFieldBar {
  let root: HTMLElement | null = null;
  let mounted = false;
  let selected: SelectedTarget = null;
  let lastAttackerName: string | null = null;

  const safeState = (): WebGameState | null =>
    typeof getGameState === 'function' ? getGameState() : null;

  const currentAttacker = (): PlayerLike => {
    if (typeof getCurrentAttacker === 'function') {
      const att = getCurrentAttacker();
      if (att) return att;
    } else if (getCurrentAttacker && typeof getCurrentAttacker === 'object') {
      return getCurrentAttacker as PlayerLike;
    }

    const st = safeState();
    return {
      id: 'att',
      name: st?.roles?.attacker,
    };
  };

  const cssSelect = (el: HTMLElement) => el.classList.add('is-selected');

  const cssUnselectAll = () => {
    if (!root) return;
    root
      .querySelectorAll<HTMLElement>('.field-card.is-selected')
      .forEach((card) => {
        card.classList.remove('is-selected');
      });
  };

  const canPick = (el: HTMLElement) =>
    !el.classList.contains('is-defeated');

  function normalizeRow(
    row: HTMLElement | string | null | undefined,
  ): HTMLElement {
    if (!row) {
      return document.createElement('div');
    }
    if (row instanceof HTMLElement) {
      return row;
    }
    if (typeof row === 'string') {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = row.trim();
      return (wrapper.firstElementChild as HTMLElement) || wrapper;
    }
    return row as HTMLElement;
  }

  function render(): void {
    if (!root) return;
    root.innerHTML = '';

    const attackerPlayer = currentAttacker();
    const attName = attackerPlayer?.name ?? null;

    if (attName !== lastAttackerName) {
      lastAttackerName = attName;
      selected = null;
    }

    const defRowRaw = fieldRenderer.createDefenderRow(
      attackerPlayer,
      getGameState,
    );
    const gkRowRaw = fieldRenderer.createGoalkeeperRow(
      attackerPlayer,
      getGameState,
    );

    const defRow = normalizeRow(defRowRaw);
    const gkRow = normalizeRow(gkRowRaw);

    defRow.querySelectorAll<HTMLElement>('.field-card').forEach((cardEl) => {
      cardEl.addEventListener('click', () => {
        if (!canPick(cardEl)) return;
        const idx = Number(cardEl.dataset.index);
        selected = { kind: 'defender', index: idx };
        cssUnselectAll();
        cssSelect(cardEl);
      });
    });

    const gkEl = gkRow.querySelector<HTMLElement>('.field-card.goalkeeper');
    if (gkEl) {
      gkEl.addEventListener('click', () => {
        if (!canPick(gkEl)) return;
        selected = { kind: 'goalkeeper' };
        cssUnselectAll();
        cssSelect(gkEl);
      });
    }

    if (selected?.kind === 'defender') {
      const selEl = defRow.querySelector<HTMLElement>(
        `.field-card[data-index="${selected.index}"]`,
      );
      if (selEl && canPick(selEl)) {
        cssSelect(selEl);
      } else {
        selected = null;
      }
    } else if (selected?.kind === 'goalkeeper') {
      if (gkEl && canPick(gkEl)) {
        cssSelect(gkEl);
      } else {
        selected = null;
      }
    }

    root.appendChild(defRow);
    root.appendChild(gkRow);
  }

  return {
    mount(container: HTMLElement | string): void {
      if (mounted) return;

      let parent: HTMLElement | null;
      if (container instanceof HTMLElement) {
        parent = container;
      } else {
        parent = document.querySelector<HTMLElement>(container);
      }
      if (!parent) return;

      root = document.createElement('div');
      root.className = 'attacker-field-bar';
      parent.appendChild(root);

      mounted = true;
      render();
    },
    isMounted: () => mounted,
    updateBar: () => render(),
    selectedTarget: () => selected,
    clearSelection() {
      selected = null;
      cssUnselectAll();
    },
  };
}
