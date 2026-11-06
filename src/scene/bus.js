// Tiny event bus + shared UI flags for the scene (Pumpkin Bear -> cat reactions, monitor hover for wheel scrolling).
const subs = new Map();
export const bus = {
  on(type, fn) {
    if (!subs.has(type)) subs.set(type, new Set());
    subs.get(type).add(fn);
    return () => { subs.get(type).delete(fn); };
  },
  emit(type, data) { (subs.get(type) || []).forEach((fn) => fn(data)); }
};
export const ui = { overScreen: false };
if (typeof window !== "undefined") window.__room = { bus, ui };
