export const GlobalObservable = (() => {
  const observers = new Set();
  return {
    add(o)   { observers.add(o); },
    remove(o){ observers.delete(o); },
    notify(ev){ for (const o of observers) { try { o.update?.(ev); } catch {} } },
  };
})();
