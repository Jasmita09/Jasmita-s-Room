// localStorage with an in-memory fallback (sandboxed previews can block storage).
const mem = {};
function detect() {
  try { const k = "__cpn"; window.localStorage.setItem(k, "1"); window.localStorage.removeItem(k); return window.localStorage; } catch (e) { return null; }
}
const store = typeof window !== "undefined" ? detect() : null;
export const storage = {
  get(key, fallback) {
    try { const raw = store ? store.getItem(key) : mem[key]; return raw == null ? fallback : JSON.parse(raw); } catch (e) { return fallback; }
  },
  set(key, value) {
    const raw = JSON.stringify(value);
    try { if (store) store.setItem(key, raw); else mem[key] = raw; } catch (e) { mem[key] = raw; }
    window.dispatchEvent(new Event("cpn-sync"));
  }
};
export function timeAgo(ts) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return m + "m ago";
  const h = Math.round(m / 60); if (h < 24) return h + "h ago";
  const d = Math.round(h / 24); if (d < 30) return d + "d ago";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
