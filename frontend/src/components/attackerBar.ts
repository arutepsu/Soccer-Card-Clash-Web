import type { WebGameState } from '../types/WebGameState';

export interface AvatarPlayer {
  id: string;
  name?: string | null;
  playerType?: string;
}

export interface AvatarRegistry {
  getAvatarFileName(player: AvatarPlayer): string;
  assignAvatarsInOrder(players: AvatarPlayer[]): void;
  getAvatarUrl(player: AvatarPlayer): string;
}

interface PlayerState {
  name?: string | null;
  playerType?: string | null;
}

type ExtendedWebGameState = WebGameState & {
  players?: {
    attacker?: PlayerState;
    defender?: PlayerState;
    [key: string]: PlayerState | undefined;
  };
  allowed: WebGameState['allowed'] & {
    [key: string]: any;
  };
};

export interface AttackerBarComponent {
  mount(el: HTMLElement | string): void;
  updateFromWebState(web: ExtendedWebGameState): void;
}

export function createAttackerBar(avatarRegistry: AvatarRegistry): AttackerBarComponent {
  let root: HTMLElement | null = null;
  let webState: ExtendedWebGameState | null = null;

  function mount(el: HTMLElement | string): void {
    if (el instanceof HTMLElement) {
      root = el;
    } else {
      root = document.querySelector<HTMLElement>(el);
    }
    if (!root) return;

    root.classList.add('attacker-bar');
    root.innerHTML = `
      <div class="attacker-bar__inner">
        <div class="attacker-avatar-col">
          <div class="player-avatar-box">
            <img class="player__avatar neon-avatar" data-attacker-avatar alt="Attacker avatar" />
          </div>
        </div>
        <div class="player-info">
          <div class="player-name" data-attacker-name></div>
          <pre class="player-actions" data-attacker-actions></pre>
        </div>
      </div>
    `;
  }

  function currentAttackerFrom(st: ExtendedWebGameState | null): AvatarPlayer {
    const pa = st?.players?.attacker;
    if (pa) {
      return {
        id: 'att',
        name: pa.name ?? st?.roles?.attacker,
        playerType: pa.playerType ?? 'Human',
      };
    }
    return {
      id: 'att',
      name: st?.roles?.attacker,
      playerType: 'Human',
    };
  }

  function render(): void {
    if (!root || !webState) return;

    const attacker = currentAttackerFrom(webState);

    try {
      avatarRegistry.getAvatarFileName(attacker);
    } catch {
      avatarRegistry.assignAvatarsInOrder([attacker]);
    }

    const img = root.querySelector<HTMLImageElement>('[data-attacker-avatar]');
    const nameEl = root.querySelector<HTMLElement>('[data-attacker-name]');
    if (img) {
      img.src = avatarRegistry.getAvatarUrl(attacker);
    }
    if (nameEl) {
      nameEl.textContent = attacker.name ?? 'Attacker';
    }

    const actionsEl = root.querySelector<HTMLElement>('[data-attacker-actions]');
    if (actionsEl) {
      const lim =
        (webState.allowed as any)?.attacker ||
        (webState.allowed as any)?.[attacker.id] ||
        {};

      const toNum = (x: unknown, fallback: number = 0): number =>
        Number.isFinite(Number(x)) ? Number(x) : fallback;

      const swap = toNum((lim as any).swapRemaining, 0);
      const boost = toNum((lim as any).boostRemaining, 0);
      const da = toNum((lim as any).doubleAttackRemaining, 0);

      actionsEl.textContent = `Swap: ${swap}\nBoost: ${boost}\nDoubleAttack: ${da}`;
    }
  }

  function updateFromWebState(web: ExtendedWebGameState): void {
    webState = web;
    render();
  }

  return { mount, updateFromWebState };
}
