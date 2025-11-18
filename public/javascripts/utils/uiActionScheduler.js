// uiActionScheduler.js

/**
 * @typedef {Object} UIAction
 * @property {number} delay   // milliseconds to wait before running block
 * @property {() => void} block
 */

/** Factory, like UIAction.delayed in Scala */
export function delayed(delay, block) {
  return { delay: Math.max(0, delay|0), block: () => block() };
}

/**
 * JS mirror of the ScalaFX UIActionScheduler using setTimeout + rAF.
 * - Runs a sequence of actions, each preceded by its delay.
 * - Ensures the block executes on the UI frame (via requestAnimationFrame).
 * - Returns a handle with cancel() to stop pending actions.
 */
export class UIActionScheduler {
  /**
   * @param {...UIAction} actions
   * @returns {{ cancel: () => void }}
   */
  runSequence(...actions) {
    let cancelled = false;
    const timeouts = new Set();

    const next = (index) => {
      if (cancelled || index >= actions.length) return;
      const { delay, block } = actions[index] ?? {};
      const id = setTimeout(() => {
        // clear out the timeout handle that just fired
        timeouts.delete(id);
        // hand back to the browser UI loop (like Platform.runLater + PauseTransition.onFinished)
        requestAnimationFrame(() => {
          try { if (typeof block === 'function') block(); }
          finally { next(index + 1); }
        });
      }, Math.max(0, delay|0));
      timeouts.add(id);
    };

    // kick it off
    next(0);

    return {
      cancel() {
        cancelled = true;
        for (const id of timeouts) clearTimeout(id);
        timeouts.clear();
      }
    };
  }
}
