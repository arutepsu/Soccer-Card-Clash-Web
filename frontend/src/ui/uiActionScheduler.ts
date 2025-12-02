export interface UIAction {
  delay: number;
  block: () => void;
}

export function delayed(delay: number, block: () => void): UIAction {
  return {
    delay: Math.max(0, delay | 0),
    block: () => block(),
  };
}

export class UIActionScheduler {
  runSequence(...actions: UIAction[]): { cancel: () => void } {
    let cancelled = false;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();

    const next = (index: number) => {
      if (cancelled || index >= actions.length) return;
      const { delay, block } = actions[index] ?? {};
      const timeoutId = setTimeout(() => {
        timeouts.delete(timeoutId);
        requestAnimationFrame(() => {
          try {
            if (typeof block === 'function') block();
          } finally {
            next(index + 1);
          }
        });
      }, Math.max(0, (delay ?? 0) | 0));

      timeouts.add(timeoutId);
    };

    next(0);

    return {
      cancel() {
        cancelled = true;
        for (const id of timeouts) clearTimeout(id);
        timeouts.clear();
      },
    };
  }
}
