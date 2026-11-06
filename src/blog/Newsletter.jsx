import React, { useState } from "react";
import { Mail } from "lucide-react";
import { SITE } from "../data/siteMeta.js";
import { storage, isEmail } from "./storage.js";
import { subscribe, hasNewsletter } from "../backend/api.js";

// Sends sign-ups to Buttondown when backend/config.js has a username (otherwise saved locally).
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(() => !!storage.get("cpn:subscribed", null));
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) return setErr("Please enter a valid email.");
    setBusy(true); setErr("");
    try { await subscribe(email.trim()); setDone(true); } catch { setErr("Couldn’t subscribe right now. Please try again."); }
    setBusy(false);
  };
  return (
    <section className="cpn-newsletter">
      <div className="cpn-nl-icon"><Mail size={16} /> The Dispatch</div>
      <h3>{SITE.newsletter.heading}</h3>
      <p>{SITE.newsletter.subtext}</p>
      {done ? (
        <div className="cpn-nl-done">{hasNewsletter() ? "Almost there! Check your inbox to confirm your subscription 🍒" : "You’re on the list 🍒 New notes will land in your inbox."}</div>
      ) : (
        <form className="cpn-nl-form" onSubmit={submit}>
          <input type="email" aria-label="Email address" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="cpn-btn is-light" type="submit" disabled={busy}>{busy ? "…" : "Subscribe"}</button>
        </form>
      )}
      {err && <div className="cpn-err is-light">{err}</div>}
    </section>
  );
}
