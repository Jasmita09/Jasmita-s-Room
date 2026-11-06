// One small data layer for comments, corkboard notes and the newsletter.
// Uses Supabase + Buttondown when configured (backend/config.js), otherwise this browser's storage.
import { BACKEND } from "./config.js";
import { storage } from "../blog/storage.js";

const cfg = () => ({ ...BACKEND, ...(typeof window !== "undefined" && window.CPN_BACKEND) });
export const isShared = () => { const c = cfg(); return !!(c.supabaseUrl && c.supabaseAnonKey); };
export const hasNewsletter = () => !!cfg().buttondownUser;

async function sb(path, opts = {}) {
  const c = cfg();
  const r = await fetch(c.supabaseUrl.replace(/\/$/, "") + "/rest/v1/" + path, {
    ...opts,
    headers: { apikey: c.supabaseAnonKey, Authorization: "Bearer " + c.supabaseAnonKey, "Content-Type": "application/json", ...(opts.headers || {}) }
  });
  if (!r.ok) throw new Error("Backend error " + r.status);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
const ts = (iso) => new Date(iso).getTime();

// ── Comments ──
export async function listComments(dispatchId) {
  if (!isShared()) return storage.get("cpn:comments:" + dispatchId, []);
  const rows = await sb("comments?select=id,name,body,likes,created_at&order=created_at.desc&limit=200&dispatch_id=eq." + encodeURIComponent(dispatchId));
  return rows.map((r) => ({ id: r.id, name: r.name, body: r.body, likes: r.likes, ts: ts(r.created_at) }));
}
export async function addComment(dispatchId, name, body) {
  if (!isShared()) {
    const key = "cpn:comments:" + dispatchId, list = storage.get(key, []);
    const c = { id: Date.now() + "-" + Math.random().toString(36).slice(2, 7), name, body, ts: Date.now(), likes: 0 };
    storage.set(key, [c, ...list]); return c;
  }
  const [r] = await sb("comments", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ dispatch_id: dispatchId, name, body }) });
  return { id: r.id, name: r.name, body: r.body, likes: 0, ts: ts(r.created_at) };
}
export async function likeComment(dispatchId, id, on) {
  if (!isShared()) {
    const key = "cpn:comments:" + dispatchId;
    storage.set(key, storage.get(key, []).map((c) => (c.id === id ? { ...c, likes: Math.max(0, (c.likes || 0) + (on ? 1 : -1)) } : c))); return;
  }
  await sb("rpc/like_comment", { method: "POST", body: JSON.stringify({ cid: id, delta: on ? 1 : -1 }) });
}

// ── Corkboard notes ──
export async function listNotes() {
  const rows = await sb("notes?select=id,text,name,color,created_at&order=created_at.asc&limit=120");
  return rows.map((r) => ({ id: r.id, text: r.text, name: r.name, color: r.color, ts: ts(r.created_at) }));
}
export async function postNote(n) {
  const [r] = await sb("notes", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ text: n.text, name: n.name, color: n.color }) });
  return { id: r.id, text: r.text, name: r.name, color: r.color, ts: ts(r.created_at) };
}

// ── Newsletter (Buttondown's public embed endpoint: no API key needed) ──
export async function subscribe(email) {
  const u = cfg().buttondownUser;
  if (u) {
    await fetch("https://buttondown.com/api/emails/embed-subscribe/" + encodeURIComponent(u), {
      method: "POST", mode: "no-cors", body: new URLSearchParams({ email, tag: "cherri-room" })
    });
  } else {
    const list = storage.get("cpn:subscribers", []); if (!list.includes(email)) list.push(email); storage.set("cpn:subscribers", list);
  }
  storage.set("cpn:subscribed", email);
}
