import React, { useEffect, useState } from "react";
import { Lock, Send, Heart, MessageCircle } from "lucide-react";
import { storage, timeAgo, isEmail } from "./storage.js";
import { listComments, addComment, likeComment, isShared } from "../backend/api.js";

const USER_KEY = "cpn:user";

export function Discussion({ dispatchId }) {
  const key = "cpn:comments:" + dispatchId;
  const [user, setUser] = useState(() => storage.get(USER_KEY, null));
  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  const load = () => listComments(dispatchId).then(setComments).catch(() => {});

  useEffect(() => { setComments([]); load(); setText(""); }, [key]);
  useEffect(() => {
    const sync = () => { if (!isShared()) load(); setUser(storage.get(USER_KEY, null)); };
    window.addEventListener("storage", sync);
    window.addEventListener("cpn-sync", sync);
    const t = setInterval(() => { tick((x) => x + 1); if (isShared() && !document.hidden) load(); }, 30000);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("cpn-sync", sync); clearInterval(t); };
  }, [key]);

  const register = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setErr("Please enter your name.");
    if (!isEmail(email)) return setErr("Please enter a valid email address.");
    setErr("");
    storage.set(USER_KEY, { name: name.trim(), email: email.trim(), joined: Date.now() });
  };
  const post = async () => {
    const body = text.trim();
    if (!body || !user || busy) return;
    setBusy(true); setErr("");
    try { const c = await addComment(dispatchId, user.name, body); setComments((l) => [c, ...l.filter((x) => x.id !== c.id)]); setText(""); }
    catch { setErr("Couldn’t post right now. Please try again in a moment."); }
    setBusy(false);
  };
  const like = (id) => {
    const likedKey = "cpn:liked";
    const liked = storage.get(likedKey, {});
    const on = !liked[id];
    liked[id] = on;
    storage.set(likedKey, liked);
    setComments((l) => l.map((c) => (c.id === id ? { ...c, likes: Math.max(0, (c.likes || 0) + (on ? 1 : -1)) } : c)));
    likeComment(dispatchId, id, on).catch(() => {});
  };
  const liked = storage.get("cpn:liked", {});

  return (
    <section className="cpn-discuss">
      <h3><MessageCircle size={17} /> Discussion & Reflections <span className="cpn-count">{comments.length}</span></h3>
      {!user ? (
        <form className="cpn-gate" onSubmit={register}>
          <div className="cpn-gate-head"><Lock size={14} /> Join the conversation</div>
          <p>Enter your name and email to unlock commenting. Your email stays in this browser and is never sent or shown publicly.</p>
          <div className="cpn-fields">
            <input aria-label="Name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <input aria-label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {err && <div className="cpn-err">{err}</div>}
          <button className="cpn-btn" type="submit">Unlock commenting</button>
        </form>
      ) : (
        <div className="cpn-composer">
          <div className="cpn-status">
            <span className="cpn-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span>Commenting as <strong>{user.name}</strong></span>
            <button className="cpn-link" onClick={() => storage.set(USER_KEY, null)}>Not you?</button>
          </div>
          <textarea
            value={text}
            maxLength={1200}
            rows={3}
            placeholder="Share a reflection, a question, or a resource you loved…"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") post(); }}
          />
          <div className="cpn-composer-foot">
            <span>{text.length}/1200 · Ctrl/⌘ + Enter to post</span>
            <button className="cpn-btn" disabled={!text.trim() || busy} onClick={post}><Send size={13} /> {busy ? "Posting…" : "Post reflection"}</button>
          </div>
        </div>
      )}
      {user && err && <div className="cpn-err">{err}</div>}
      {isShared() && <p className="cpn-public">Reflections here are public 🌍</p>}
      {comments.length === 0 ? (
        <p className="cpn-empty">No reflections yet. Be the first to leave one 🍒</p>
      ) : (
        <ul className="cpn-comments">
          {comments.map((c) => (
            <li key={c.id} className="cpn-comment">
              <span className="cpn-avatar">{c.name.charAt(0).toUpperCase()}</span>
              <div>
                <div className="cpn-comment-head"><strong>{c.name}</strong><time>{timeAgo(c.ts)}</time></div>
                <p className="cpn-comment-body">{c.body}</p>
                <button className={"cpn-like" + (liked[c.id] ? " is-on" : "")} onClick={() => like(c.id)}><Heart size={12} /> {c.likes || 0}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
