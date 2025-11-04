// /assets/javascripts/scenes/WebSceneManager.js
import { GlobalObservable } from '../core/Observable.js';
import { SceneRegistry, SceneSwitchEvent } from './registry.js';
import { createGameApi } from '../api/gameApi.js';
import { createOverlay } from '../overlay.js';
import { createGameAlert } from '../utils/gameAlert.js';

function getCsrf() {
  return document.querySelector('meta[name="csrf-token"]')?.content;
}

export class WebSceneManager {
  constructor() {
    this.current = null;
    this.currentId = null;
    this.root = document.getElementById('app'); 
    this.overlay = null;
    this.api = null;
    GlobalObservable.add(this);
  }

  async init() {
    this.api = createGameApi({ csrfToken: getCsrf() });
    const overlayEl = document.getElementById('overlay');
    this.overlay = overlayEl ? createOverlay({ host: overlayEl }) : null;

    const initialId = this.root?.dataset?.scene || SceneSwitchEvent.PlayingField;
    await this.switchTo(initialId, { withFade: false });
  }

  async update(ev) {
    if (typeof ev === 'string' && SceneRegistry[ev]) {
      await this.switchTo(ev, { withFade: true });
    }
  }

  async switchTo(sceneId, { withFade = true } = {}) {
    if (this.currentId === sceneId) return;

    const mod = SceneRegistry[sceneId];
    if (!mod?.build) return;

    if (withFade && this.root) {
      this.fadeOut(this.root, 200);
      await this.wait(180);
    }

    try { this.current?.destroy?.(); } catch {}
    this.current = null;

    this.currentId = sceneId;
    this.current = await mod.build({
      api: this.api,
      overlay: this.overlay,
      createGameAlert,
    });

    if (withFade && this.root) {
      this.fadeIn(this.root, 400);
    }
  }
  wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  fadeOut(el, ms = 200) {
    el.style.transition = `opacity ${ms}ms ease`;
    el.style.opacity = '0.15';
  }
  fadeIn(el, ms = 400) {
    el.style.transition = `opacity ${ms}ms ease`;
    el.style.opacity = '1';
  }
}
