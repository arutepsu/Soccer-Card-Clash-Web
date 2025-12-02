declare const $: any;

import type { Overlay } from '../ui/overlay';

export interface ActionButtonBarHoverEvent {
  type: 'hover';
  action: string;
}

export interface ActionButtonBarOptions {
  overlay?: Overlay | null;
}

export interface ActionButtonBar {
  mount(el: HTMLElement | string | any): void;
  setEnabled(map: Record<string, boolean>): void;
  onClick(fn: (action: string) => void): void;
  onHoverEvent(fn: (ev: ActionButtonBarHoverEvent) => void): void;
}

export function createActionButtonBar(
  { overlay }: ActionButtonBarOptions = {},
): ActionButtonBar {
  let $root: any = null;
  let onAction: (action: string) => void = () => {};
  let onHover: ((ev: ActionButtonBarHoverEvent) => void) | null = null;

  function mount(el: HTMLElement | string | any): void {
    $root = $(el);

    $root.html(`
      <button type="button" class="gbtn" data-action="attack-regular">Attack</button>
      <button type="button" class="gbtn" data-action="attack-double">Double Attack</button>
      <button type="button" class="gbtn" data-action="info">Info</button>
    `);

    $root.off('click.actionBar');
    $root.off('mouseenter.actionBar');

    $root.on('click.actionBar', '[data-action]', function (this: any, e: Event) {
      e.preventDefault();
      const action = $(this).data('action') as string;

      if (action === 'info') {
        openInfoDialog('GAME_INFO');
        return;
      }

      if (typeof onAction === 'function') {
        onAction(action);
      }
    });

    $root.on('mouseenter.actionBar', '[data-action]', function (this: any) {
      if (!onHover) return;
      const $btn = $(this);
      if ($btn.prop('disabled')) return;

      const action = $btn.data('action') as string;
      onHover({ type: 'hover', action });
    });
  }

  function setEnabled(map: Record<string, boolean>): void {
    if (!$root) return;
    Object.entries(map).forEach(([action, enabled]) => {
      const $btn = $root.find(`[data-action="${action}"]`);
      $btn.prop('disabled', !enabled);
    });
  }

  function onClick(fn: (action: string) => void): void {
    if (typeof fn === 'function') {
      onAction = fn;
    }
  }

  function onHoverEvent(fn: (ev: ActionButtonBarHoverEvent) => void): void {
    if (typeof fn === 'function') {
      onHover = fn;
    }
  }

  function openInfoDialog(key: string = 'GAME_INFO'): void {
    if (!overlay) return;

    const node = document.createElement('div');
    node.className = 'overlay-textflow';
    node.innerHTML = `
      <div class="dialog-title">Game Instructions</div>
      <div class="dialog-message">
        (${key}) — put localized content here.
      </div>
      <div class="overlay-actions">
        <button class="gbtn" data-close-overlay>Close</button>
      </div>
    `;

    node
      .querySelector<HTMLElement>('[data-close-overlay]')
      ?.addEventListener('click', () => {
        overlay.hide();
      });

    overlay.show(node, { autoHide: false });
  }

  return {
    mount,
    setEnabled,
    onClick,
    onHoverEvent,
  };
}
