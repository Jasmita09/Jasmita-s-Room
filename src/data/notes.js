// Visitor sticky notes + carved pumpkin, saved in this browser (localStorage).
import { isShared, listNotes, postNote } from "../backend/api.js";
const KEY = "cpn-notes";
const START = [{ id: "welcome", text: "Welcome to my room! Pin a little note for the next visitor \u2661", name: "Jasmita", color: "#ffe58a", ts: 0 }];
const subs = new Set();
let remote = null, loading = null;
function local() { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : START; } catch { return START; } }
export function getNotes() { if (isShared()) { if (!remote) refreshNotes(); return remote || START; } return local(); }
export function refreshNotes() {
  if (!isShared() || loading) return loading;
  loading = listNotes().then((v) => { remote = [...START, ...v]; subs.forEach((f) => f(remote)); }).catch(() => {}).finally(() => { loading = null; });
  return loading;
}
function put(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} subs.forEach((f) => f(v)); }
export const onNotes = (f) => { subs.add(f); return () => subs.delete(f); };
export async function addNote(n) {
  if (isShared()) { const r = await postNote(n); remote = [...(remote || START), r]; subs.forEach((f) => f(remote)); return; }
  put([...local(), { ...n, id: Date.now().toString(36), ts: Date.now() }]);
}
if (typeof window !== "undefined") setInterval(() => { if (isShared() && !document.hidden) refreshNotes(); }, 60000);
export function removeNote(id) { if (!isShared()) put(local().filter((n) => n.id !== id)); }

export const EMPTY_CARVE = "0".repeat(64);
export function getCarve() { try { const v = localStorage.getItem("cpn-carve"); return v && v.length === 64 ? v : EMPTY_CARVE; } catch { return EMPTY_CARVE; } }
export function saveCarve(bits) { try { localStorage.setItem("cpn-carve", bits); } catch {} }
