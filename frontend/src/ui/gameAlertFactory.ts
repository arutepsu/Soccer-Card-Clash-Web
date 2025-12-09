export interface GameAlertOptions {
  message?: string;
  okText?: string;
  autoHideMs?: number | null;
  onOk?: () => void;
}

export interface GameAlertElement extends HTMLDivElement {
  cleanup?: () => void;
}

export function createGameAlert({
  message,
  okText = 'OK',
  autoHideMs = null,
  onOk = () => {},
}: GameAlertOptions = {}): GameAlertElement {
  const root = document.createElement('div') as GameAlertElement;
  root.className = 'game-alert';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Game message');

  const box = document.createElement('div');
  box.className = 'game-alert__box';

  const text = document.createElement('div');
  text.className = 'dialog-message';
  text.textContent = message ?? '';

  const btn = document.createElement('button');
  btn.className = 'gbtn gbtn--lg game-alert__ok';
  btn.type = 'button';
  btn.textContent = okText;

  function close() {
    try {
      onOk();
    } catch {
    }
  }

  btn.addEventListener('click', close);

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  root.addEventListener('keydown', onKey);

  queueMicrotask(() => btn.focus());

  let timer: number | null = null;
  if (typeof autoHideMs === 'number' && autoHideMs > 0) {
    timer = window.setTimeout(() => close(), autoHideMs);
  }

  root.cleanup = () => {
    root.removeEventListener('keydown', onKey);
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  box.appendChild(text);
  box.appendChild(btn);
  root.appendChild(box);

  return root;
}
