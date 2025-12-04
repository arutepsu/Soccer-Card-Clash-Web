// import type {
//   WebGameState,
//   PlayerLike,
//   ActionLimitsView,
// } from '../types/WebGameState';

// export interface AvatarRegistry {
//   getAvatarFileName(player: PlayerLike): string;
//   assignAvatarsInOrder(players: PlayerLike[]): void;
//   getAvatarUrl(player: PlayerLike): string;
// }

// export interface AttackerBarComponent {
//   mount(el: HTMLElement | string): void;
//   updateFromWebState(web: WebGameState): void;
// }

// export function createAttackerBar(
//   avatarRegistry: AvatarRegistry,
// ): AttackerBarComponent {
//   let root: HTMLElement | null = null;
//   let webState: WebGameState | null = null;

//   function mount(el: HTMLElement | string): void {
//     if (el instanceof HTMLElement) {
//       root = el;
//     } else {
//       root = document.querySelector<HTMLElement>(el);
//     }
//     if (!root) return;

//     root.classList.add('attacker-bar');
//     root.innerHTML = `
//       <div class="attacker-bar__inner">
//         <div class="attacker-avatar-col">
//           <div class="player-avatar-box">
//             <img class="player__avatar neon-avatar" data-attacker-avatar alt="Attacker avatar" />
//           </div>
//         </div>
//         <div class="player-info">
//           <div class="player-name" data-attacker-name></div>
//           <pre class="player-actions" data-attacker-actions></pre>
//         </div>
//       </div>
//     `;
//   }

//   function currentAttackerFrom(st: WebGameState | null): PlayerLike {
//     const pa = (st as any)?.players?.attacker as PlayerLike | undefined;

//     if (pa) {
//       return {
//         id: 'att',
//         name: pa.name ?? st?.roles.attacker,
//         playerType: pa.playerType ?? 'Human',
//       };
//     }

//     return {
//       id: 'att',
//       name: st?.roles.attacker,
//       playerType: 'Human',
//     };
//   }

//   function getAllowedForAttacker(st: WebGameState, attackerId: string): Partial<ActionLimitsView> {
//     const base = st.allowed?.attacker as Partial<ActionLimitsView> | undefined;

//     const keyed = (st.allowed as any)?.[attackerId] as Partial<ActionLimitsView> | undefined;

//     return base ?? keyed ?? {};
//   }

//   function render(): void {
//     if (!root || !webState) return;

//     const attacker = currentAttackerFrom(webState);

//     try {
//       avatarRegistry.getAvatarFileName(attacker);
//     } catch {
//       avatarRegistry.assignAvatarsInOrder([attacker]);
//     }

//     const img = root.querySelector<HTMLImageElement>('[data-attacker-avatar]');
//     const nameEl = root.querySelector<HTMLElement>('[data-attacker-name]');
//     if (img) {
//       img.src = avatarRegistry.getAvatarUrl(attacker);
//     }
//     if (nameEl) {
//       nameEl.textContent = attacker.name ?? 'Attacker';
//     }

//     const actionsEl = root.querySelector<HTMLElement>('[data-attacker-actions]');
//     if (actionsEl) {
//       const lim = getAllowedForAttacker(webState, attacker.id);

//       const toNum = (x: unknown, fallback: number = 0): number =>
//         Number.isFinite(Number(x)) ? Number(x) : fallback;

//       const swap = toNum(lim.swapRemaining, 0);
//       const boost = toNum(lim.boostRemaining, 0);
//       const da = toNum(lim.doubleAttackRemaining, 0);

//       actionsEl.textContent = `Swap: ${swap}\nBoost: ${boost}\nDoubleAttack: ${da}`;
//     }
//   }

//   function updateFromWebState(web: WebGameState): void {
//     webState = web;
//     render();
//   }

//   return { mount, updateFromWebState };
// }
