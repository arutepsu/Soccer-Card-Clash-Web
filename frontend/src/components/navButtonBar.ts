import { fileIOApi } from '../api/fileIoApi';
import type { GameApi } from '../api/gameApi';
import type { PushClient } from '../api/serverPushClient';
import type { Overlay } from '../ui/overlay';

export interface SoundManager {
  play(name: string, opts?: { volume?: number; loop?: boolean }): void;
}

export type NavigateFn = (path: string) => void;

export type SceneEvent =
  | { type: 'SceneSwitchEvent' }
  | { type: 'PauseDialogAction'; action: string };

export interface NavButtonBarOptions {
  navigate?: NavigateFn;
  api?: GameApi;
  push?: PushClient;
  overlay?: Overlay | null;
  soundManager?: SoundManager | null;
}
export interface NavButtonBar {
  mount(el: HTMLElement): void;
  onSceneEvent(fn: (ev: SceneEvent) => void): void;
}

export function createNavButtonBar(
  { navigate, api, push, overlay, soundManager }: NavButtonBarOptions = {},
): NavButtonBar {
  let root: HTMLElement | null = null;
  let onEvent: (ev: SceneEvent) => void = () => {};

  function go(path: string): void {
    if (typeof navigate === 'function') navigate(path);
    else window.location.href = path;
  }

  async function doRestart(): Promise<void> {
    const btns = root?.querySelectorAll<HTMLElement>('[data-pause-action]');
    btns?.forEach((b) => b.setAttribute('disabled', 'true'));
    try {
      if (api?.restart) {
        await api.restart();
      } else {
        await fetch('/api/game/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      go('/playing-field');
    } catch (e) {
      console.error('Restart failed', e);
      alert('Restart failed. Please try again.');
    } finally {
      btns?.forEach((b) => b.removeAttribute('disabled'));
    }
  }

  function mount(el: HTMLElement): void {
    root = el;
    root.innerHTML = `
      <button class="gbtn" data-action="pause">Pause</button>
      <button class="gbtn" data-action="show-defenders">Show Defenders</button>
      <button class="gbtn" data-action="make-swap">Make Swap</button>
    `;

    root.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest<HTMLElement>('[data-action]');
      if (!btn) return;

      if (soundManager && !btn.hasAttribute('disabled')) {
        soundManager.play('hover', { volume: 0.6 });
      }

      const a = btn.dataset.action;

      if (a === 'pause') {
        openPauseDialog();
        return;
      }

      if (a === 'show-defenders') {
        onEvent({ type: 'SceneSwitchEvent' });
        go('/attacker-defenders');
        return;
      }

      if (a === 'make-swap') {
        onEvent({ type: 'SceneSwitchEvent' });
        go('/attacker-hand');
        return;
      }
    });

    root.addEventListener(
      'mouseenter',
      (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        const btn = target?.closest<HTMLElement>('[data-action]');
        if (btn && soundManager && !btn.hasAttribute('disabled')) {
          soundManager.play('hover', { volume: 0.3 });
        }
      },
      true,
    );
  }

  function openPauseDialog(): void {
    if (!overlay || !overlay.show) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const node = document.createElement('div');
    node.className = 'overlay-textflow';
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-label', 'Paused');
    node.innerHTML = `
      <h2 class="dialog-title" style="text-align:center;">Paused</h2>
      <div class="overlay-actions"
           style="display:flex; flex-direction:column; gap:12px; align-items:center; justify-content:center;">
        <button class="gbtn" data-pause-action="resume">Resume</button>
        <button class="gbtn" data-pause-action="undo">Undo</button>
        <button class="gbtn" data-pause-action="redo">Redo</button>
        <button class="gbtn" data-pause-action="save">Save Game</button>
        <button class="gbtn" data-pause-action="restart">Restart</button>
        <button class="gbtn" data-pause-action="mainmenu">Main Menu</button>
      </div>
    `;

    const finishAndClose = (action: string): void => {
      onEvent({ type: 'PauseDialogAction', action });
      cleanup();
      overlay?.hide?.();

      if (previouslyFocused && document.contains(previouslyFocused)) {
        try {
          previouslyFocused.focus();
        } catch {
          // ignore
        }
      }
    };

    const onClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLButtonElement>('[data-pause-action]');
      if (!el) return;

      if (soundManager && !el.hasAttribute('disabled')) {
        soundManager.play('hover', { volume: 0.6 });
      }

      const act = el.dataset.pauseAction;

      if (act === 'resume') {
        finishAndClose('resume');
        return;
      }

      if (act === 'undo') {
        finishAndClose('undo');
        return;
      }

      if (act === 'redo') {
        finishAndClose('redo');
        return;
      }

      if (act === 'restart') {
        onEvent({ type: 'PauseDialogAction', action: 'restart' });
        cleanup();
        overlay?.hide?.();
        void doRestart();
        return;
      }

      if (act === 'mainmenu') {
        onEvent({ type: 'PauseDialogAction', action: 'mainmenu' });
        cleanup();
        overlay?.hide?.();
        go('/main-menu');
        return;
      }

      if (act === 'save') {
        onEvent({ type: 'PauseDialogAction', action: 'save' });
        el.setAttribute('disabled', 'true');
        el.textContent = 'Saving...';

        fileIOApi
          .quickSave()
          .then(() => {
            console.log('Game saved successfully');

            if (soundManager) {
              soundManager.play('success', { volume: 0.7 });
            }

            cleanup();
            overlay?.hide?.();
            if (previouslyFocused && document.contains(previouslyFocused)) {
              try {
                previouslyFocused.focus();
              } catch {
                // ignore
              }
            }

            const savedMsg = document.createElement('div');
            savedMsg.className = 'save-notification';
            savedMsg.textContent = 'Game Saved!';
            savedMsg.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: #4CAF50;
              color: white;
              padding: 20px 40px;
              border-radius: 10px;
              font-size: 20px;
              font-weight: bold;
              z-index: 10001;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            `;
            document.body.appendChild(savedMsg);

            setTimeout(() => {
              savedMsg.remove();
              go('/main-menu');
            }, 1500);
          })
          .catch((error: any) => {
            console.error('Save failed:', error);
            el.removeAttribute('disabled');
            el.textContent = 'Save Game';
            alert('Failed to save game: ' + (error?.message ?? 'Unknown error'));
          });

        return;
      }
    };

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finishAndClose('resume');
      }
    };

    const onHover = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLButtonElement>('[data-pause-action]');
      if (el && soundManager && !el.hasAttribute('disabled')) {
        soundManager.play('hover', { volume: 0.3 });
      }
    };

    function cleanup(): void {
      node.removeEventListener('click', onClick);
      node.removeEventListener('mouseenter', onHover, true);
      document.removeEventListener('keydown', onKey);
    }

    node.addEventListener('click', onClick);
    node.addEventListener('mouseenter', onHover, true);
    document.addEventListener('keydown', onKey);

    overlay.show(node, { autoHide: false });

    const firstBtn = node.querySelector<HTMLElement>('[data-pause-action]');
    firstBtn?.focus();
  }

  function onSceneEvent(fn: (ev: SceneEvent) => void): void {
    if (typeof fn === 'function') {
      onEvent = fn;
    }
  }

  return { mount, onSceneEvent };
}
