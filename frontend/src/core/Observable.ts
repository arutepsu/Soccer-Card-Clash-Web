export interface GlobalObserver {
  update?(ev: any): void;
}

export const GlobalObservable = (() => {
  const observers = new Set<GlobalObserver>();

  return {
    add(o: GlobalObserver) {
      observers.add(o);
    },

    remove(o: GlobalObserver) {
      observers.delete(o);
    },

    notify(ev: any) {
      for (const o of observers) {
        try {
          o.update?.(ev);
        } catch (e) {
        }
      }
    },
  };
})();
