import { GlobalObservable, type GlobalObserver } from '../core/Observable';
import {
  SceneRegistry,
  SceneSwitchEvent,
  type SceneId,
} from './registry';
import { createGameApi, type GameApi } from '../api/gameApi';
import { createOverlay, type Overlay } from '../ui/overlay';
import { createGameAlert } from '../ui/gameAlert';
import {
  createServerPushClient,
  type PushClient,
} from '../api/serverPushClient';
import {
  createGameEventStream,
  type StreamClient,
} from '../api/gameEventStream';

import type { Scene, SceneBuildContext } from './Scene';

export class WebSceneManager implements GlobalObserver {
  private current: Scene | null = null;
  private currentId: SceneId | null = null;
  private root: HTMLElement | null;

  private overlay: Overlay | null = null;
  private api: GameApi | null = null;
  private push: PushClient | null = null;
  private streamClient: StreamClient | null = null;

  constructor() {
    this.root = document.getElementById('app') as HTMLElement | null;
    GlobalObservable.add(this);
  }

  async init(): Promise<void> {
    this.push = createServerPushClient();

    this.push.onMessage((env: any) => {
      if (this.current?.onPushMessage) {
        try {
          this.current.onPushMessage(env);
        } catch (e) {
          console.error('[WebSceneManager] onPushMessage error:', e);
        }
      }
    });

    this.streamClient = createGameEventStream();

    this.api = createGameApi({
      streamClient: this.streamClient,
    });

    this.api.openStream((state) => {
      if (this.current?.refresh) {
        try {
          this.current.refresh(state);
        } catch (e) {
          console.error('[WebSceneManager] refresh() error:', e);
        }
      }
    });

    const overlayEl = document.getElementById('overlay');
    this.overlay = overlayEl
      ? createOverlay({ host: overlayEl })
      : null;

    const initialId: SceneId =
      (this.root?.dataset?.scene as SceneId) ||
      SceneSwitchEvent.PlayingField;

    await this.switchTo(initialId, { withFade: false });
  }

  async update(ev: any): Promise<void> {
    if (typeof ev === 'string' && (SceneRegistry as any)[ev]) {
      await this.switchTo(ev as SceneId, { withFade: true });
    }
  }

  async switchTo(sceneId: SceneId, { withFade = true } = {}): Promise<void> {
    if (this.currentId === sceneId) return;

    const mod = SceneRegistry[sceneId];
    if (!mod?.build) {
      console.warn('[WebSceneManager] Unknown sceneId:', sceneId);
      return;
    }

    if (withFade && this.root) {
      this.fadeOut(this.root, 200);
      await this.wait(180);
    }

    try {
      this.current?.destroy();
    } catch (e) {
      console.warn('[WebSceneManager] destroy() threw:', e);
    }

    this.current = null;
    this.currentId = sceneId;

    const ctx: SceneBuildContext = {
      api: this.api,
      push: this.push,
      overlay: this.overlay,
      createGameAlert,
    };

    this.current = (await mod.build(ctx)) as Scene;

    if (withFade && this.root) {
      this.fadeIn(this.root, 400);
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private fadeOut(el: HTMLElement, ms = 200): void {
    el.style.transition = `opacity ${ms}ms ease`;
    el.style.opacity = '0.15';
  }

  private fadeIn(el: HTMLElement, ms = 400): void {
    el.style.transition = `opacity ${ms}ms ease`;
    el.style.opacity = '1';
  }
}
