// /assets/javascripts/scenes/mainMenuScene.js
import { createSoundManager } from './utils/soundManager.js';

export async function build({ overlay /* api not needed here */, createGameAlert }) {
  // Sound Manager 
  const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
  soundManager.preload('hover', 'hover.wav');
  soundManager.preload('click', 'attack.wav');

  const unlockAudio = () => {
  soundManager.unlock();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
};
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
  
  setTimeout(() => soundManager.debug?.(), 1000);
  
  const root = document.querySelector('.scene--mainmenu');
  const nav  = root?.querySelector('.buttons');
  if (!root || !nav) {
    return { destroy() {}, refresh: async () => {} };
  }

  const btnAbout = nav.querySelector('[data-open-overlay]');
  const buttons  = Array.from(nav.querySelectorAll('.gbtn'));

  const overlayHost = document.getElementById('overlay');

  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      console.log('[MainMenu] Button hover detected:', btn.textContent);
      soundManager.play('hover', { volume: 0.8 });
    });
    
    btn.addEventListener('click', () => {
      console.log('[MainMenu] Button click detected:', btn.textContent);
      if (!btn.disabled) {
        soundManager.play('click', { volume: 0.6 });
      }
    });
  });

  function openAbout() {
    if (!overlay || !overlayHost) return;
    const content = overlayHost.querySelector('.overlay-scroll')?.firstElementChild
                 || overlayHost.querySelector('.overlay-frame')
                 || document.createElement('div');
    overlay.show(content, { onHide: () => {/* no-op */} });
  }

  function moveFocus(delta) {
    const focusables = buttons.filter(b => !b.disabled);
    if (!focusables.length) return;
    const idx = Math.max(0, focusables.indexOf(document.activeElement));
    const next = (idx + delta + focusables.length) % focusables.length;
    focusables[next].focus();
  }

  function onKeydown(e) {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault(); moveFocus(+1); break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault(); moveFocus(-1); break;
      case 'Escape':
        overlay?.hide?.(); break;
    }
  }

  btnAbout?.addEventListener('click', openAbout);
  root.addEventListener('keydown', onKeydown);

  buttons[0]?.focus?.();

  return {
    destroy() {
      btnAbout?.removeEventListener('click', openAbout);
      root.removeEventListener('keydown', onKeydown);
    },
    refresh: async () => {},
  };
}
