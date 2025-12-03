import type {
  WebGameState,
  AllowedActionsView,
  ActionLimitsView,
} from '../types/WebGameState';

export interface AvatarPlayer {
  id: string;
  name?: string | null;
}

export interface AvatarRegistry {
  getAvatarUrl(player: AvatarPlayer): string | null | undefined;
}

export interface PlayersBar {
  mount(el: HTMLElement | string): void;
  updateFromWebState(webState: WebGameState): void;
  refreshActionStates(): void;
  refreshScores(scores?: { attacker?: number | null; defender?: number | null }): void;
  refreshOnRoleSwitch(): void;
}

export function createPlayersBar(registry: AvatarRegistry): PlayersBar {
  let root: HTMLElement | null = null;
  let web: WebGameState | null = null;

  function mount(el: HTMLElement | string): void {
    if (el instanceof HTMLElement) {
      root = el;
    } else {
      root = document.querySelector<HTMLElement>(el);
    }
    if (!root) return;

    root.classList.add('players-bar');

    root.innerHTML = `
      <div class="players-bar__inner">
        <div class="player-avatar-box">
          <img class="player__avatar" data-attacker-avatar alt="Attacker avatar" />
        </div>

        <div class="player-info">
          <div class="player-name" data-attacker-name></div>
          <pre class="player-actions" data-attacker-actions></pre>
        </div>

        <div class="score-box">
          <div class="scores-title">Scores</div>
          <div class="score-row">
            <span class="player-score" data-attacker-score>0</span>
            <span class="spacer"></span>
            <span class="player-score" data-defender-score>0</span>
          </div>
        </div>

        <div class="player-info">
          <div class="player-name" data-defender-name></div>
          <pre class="player-actions" data-defender-actions></pre>
        </div>

        <div class="player-avatar-box">
          <img class="player__avatar" data-defender-avatar alt="Defender avatar" />
        </div>
      </div>
    `;
  }

  function updateFromWebState(webState: WebGameState): void {
    web = webState;
    if (!root || !web) return;

    const aName = web.roles?.attacker ?? '';
    const dName = web.roles?.defender ?? '';
    const aScore = toNum(web.scores?.attacker, 0);
    const dScore = toNum(web.scores?.defender, 0);

    setText('[data-attacker-name]', aName);
    setText('[data-defender-name]', dName);
    setText('[data-attacker-score]', aScore);
    setText('[data-defender-score]', dScore);

    setAvatar('[data-attacker-avatar]', { id: 'att', name: aName });
    setAvatar('[data-defender-avatar]', { id: 'def', name: dName });

    refreshActionStates();
  }

  function refreshActionStates(): void {
    if (!root || !web) return;
    const allowed: AllowedActionsView | undefined = web.allowed;
    const aAllowed: ActionLimitsView | undefined = allowed?.attacker;
    const dAllowed: ActionLimitsView | undefined = allowed?.defender;

    setText('[data-attacker-actions]', formatAllowed(aAllowed));
    setText('[data-defender-actions]', formatAllowed(dAllowed));
  }

  function refreshScores(scores?: {
    attacker?: number | null;
    defender?: number | null;
  }): void {
    if (!root) return;

    if (scores) {
      if (scores.attacker != null) {
        setText('[data-attacker-score]', toNum(scores.attacker, 0));
      }
      if (scores.defender != null) {
        setText('[data-defender-score]', toNum(scores.defender, 0));
      }
      return;
    }

    if (!web) return;
    setText('[data-attacker-score]', toNum(web.scores?.attacker, 0));
    setText('[data-defender-score]', toNum(web.scores?.defender, 0));
  }

  function refreshOnRoleSwitch(): void {
    refreshActionStates();
    refreshScores();
  }

  function setText(selector: string, v: string | number): void {
    if (!root) return;
    const el = root.querySelector<HTMLElement>(selector);
    if (el) el.textContent = String(v);
  }

  function setAvatar(selector: string, player: AvatarPlayer): void {
    if (!root || !player) return;
    const img = root.querySelector<HTMLImageElement>(selector);
    if (!img) return;

    try {
      const url = registry.getAvatarUrl(player);
      if (!url) return;

      img
        .setAttribute('src', url);

      img.decoding = 'async';
      img.loading = 'lazy';

      Object.assign(img.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '0',
        display: 'block',
        maxWidth: '',
        maxHeight: '',
      } as Partial<CSSStyleDeclaration>);

      img.removeAttribute('width');
      img.removeAttribute('height');
    } catch {
    }
  }

  function toNum(x: unknown, fallback: number): number {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatAllowed(lim?: ActionLimitsView): string {
    if (!lim) {
      return `Swap: 0\nBoost: 0\nDoubleAttack: 0`;
    }
    const swap = toNum(lim.swapRemaining, 0);
    const boost = toNum(lim.boostRemaining, 0);
    const da = toNum(lim.doubleAttackRemaining, 0);
    return `Swap: ${swap}\nBoost: ${boost}\nDoubleAttack: ${da}`;
  }

  return {
    mount,
    updateFromWebState,
    refreshActionStates,
    refreshScores,
    refreshOnRoleSwitch,
  };
}
