import React, { useEffect, useMemo, useState } from "react";
import { X, PenLine, BookOpen, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { SITE } from "../data/siteMeta.js";
import { visibleEntries, parseDay, dayKey } from "../data/journal.js";
import { playPage } from "../audio/keyClick.js";
import { cardOfDay } from "../data/oracle.js";
import { isShared } from "../backend/api.js";
import { getNotes, onNotes, addNote, removeNote, refreshNotes, getCarve, saveCarve, EMPTY_CARVE } from "../data/notes.js";
import { bus } from "../scene/bus.js";

function Modal({ onClose, className = "", children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={"modal " + className} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

export function WitchModal({ onClose }) {
  return (
    <Modal onClose={onClose} className="witch">
      <div className="witch-stars" aria-hidden="true">{["✦", "✧", "✦", "✧", "✦", "✧"].map((s, i) => <span key={i} style={{ left: 8 + i * 16 + "%", animationDelay: i * 0.3 + "s" }}>{s}</span>)}</div>
      <div className="witch-art">{"🧙🏽‍♀️"}</div>
      <div className="witch-eyebrow">{"✨ You found the shelf witch ✨"}</div>
      <p className="witch-msg">{SITE.witchMessage}</p>
      <div className="witch-pumpkins">{"🎃 🍂 🎃 🍂 🎃"}</div>
      <button className="btn-primary" onClick={onClose}>Keep exploring</button>
    </Modal>
  );
}

export function BookModal({ book, onClose }) {
  return (
    <Modal onClose={onClose} className="book">
      <div className="book-card">
        <div className="book-cover" style={{ "--c": book.color, "--a": book.accent, color: book.ink }}>
          <div className="bc-kind">{book.kind}</div>
          <div className="bc-title">{book.title}</div>
          <div className="bc-rule" />
          <div className="bc-author">{book.author}</div>
          <div className="bc-year">{book.year}</div>
        </div>
        <div className="book-info">
          <div className="bi-eyebrow">Reading card · {book.status}</div>
          <h3>{book.title}</h3>
          <div className="bi-author">by {book.author} · {book.year}</div>
          <div className="bi-tags">{book.tags.map((t) => <span key={t}>{t}</span>)}</div>
          <div className="bi-notes-label">Jasmita’s notes</div>
          <ul className="bi-notes">{book.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          {book.linkedDispatch && <div className="bi-linked"><PenLine size={14} /> Full write-up: Dispatch 03 on the computer (draft in progress)</div>}
          {book.url && <a className="bi-linked bi-url" href={book.url} target="_blank" rel="noopener noreferrer">Read it at {book.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗</a>}
        </div>
      </div>
    </Modal>
  );
}

// The desk notebook: one reflection per day, flip pages or jump from the calendar.
export function JournalModal({ onClose }) {
  const entries = useMemo(() => visibleEntries(), []);
  const todayK = dayKey();
  const start = (() => { const k = entries.findIndex((e) => e.date === todayK); return k >= 0 ? k : Math.max(0, entries.length - 1); })();
  const [i, setI] = useState(start);
  const [dir, setDir] = useState(0);
  const [tab, setTab] = useState("book");
  const [month, setMonth] = useState(() => { const dd = entries[start] ? parseDay(entries[start].date) : new Date(); return new Date(dd.getFullYear(), dd.getMonth(), 1); });
  const go = (n) => { if (n < 0 || n >= entries.length || n === i) return; setDir(n > i ? 1 : -1); setI(n); playPage(); };
  useEffect(() => {
    const onKey = (e) => { if (tab !== "book") return; if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const e = entries[i];
  const date = e ? parseDay(e.date) : new Date();
  const y = month.getFullYear(), mo = month.getMonth();
  const byDate = new Map(entries.map((x, k) => [x.date, k]));
  const first = new Date(y, mo, 1).getDay(), days = new Date(y, mo + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, k) => k + 1)];
  const keyOf = (dd) => y + "-" + String(mo + 1).padStart(2, "0") + "-" + String(dd).padStart(2, "0");
  return (
    <Modal onClose={onClose} className="journal">
      <div className="nb-tabs">
        <button className={tab === "book" ? "on" : ""} onClick={() => setTab("book")}><BookOpen size={15} /> Notebook</button>
        <button className={tab === "cal" ? "on" : ""} onClick={() => { setTab("cal"); setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}><CalendarDays size={15} /> Calendar</button>
      </div>
      {tab === "book" ? (e ? (
        <>
          <div className="nb-book">
            <div key={"L" + i} className={"nb-page nb-left" + (dir > 0 ? " flip-next" : "")}>
              <div className="nb-weekday">{date.toLocaleDateString("en-US", { weekday: "long" })}</div>
              <div className="nb-day">{date.getDate()}</div>
              <div className="nb-month">{date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
              <div className="nb-doodle" aria-hidden="true">{"\u{1F383}"}</div>
              <div className="nb-count">{"Page " + (i + 1) + " of " + entries.length}</div>
            </div>
            <div key={"R" + i} className={"nb-page nb-right" + (dir < 0 ? " flip-prev" : "")}>
              <div className="nb-label">{e.holiday || (e.date === todayK ? "Today\u2019s reflection" : "Reflection of the day")}</div>
              <p className={"nb-quote" + (e.text.length > 120 ? " long" : "")}>{e.text}</p>
              <div className="nb-sign">{e.by ? "\u2014 " + e.by : "\u2014 J. \u{1F352}"}</div>
            </div>
          </div>
          <div className="nb-nav">
            <button disabled={i === 0} onClick={() => go(i - 1)}><ChevronLeft size={16} /> Earlier day</button>
            <span>{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <button disabled={i === entries.length - 1} onClick={() => go(i + 1)}>Later day <ChevronRight size={16} /></button>
          </div>
        </>
      ) : <p className="nb-empty">No reflections yet. Check back soon!</p>) : (
        <div className="cal">
          <div className="cal-head">
            <button aria-label="Previous month" onClick={() => setMonth(new Date(y, mo - 1, 1))}><ChevronLeft size={18} /></button>
            <b>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</b>
            <button aria-label="Next month" onClick={() => setMonth(new Date(y, mo + 1, 1))}><ChevronRight size={18} /></button>
          </div>
          <div className="cal-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => <div key={w} className="cal-dow">{w}</div>)}
            {cells.map((dd, k) => {
              if (!dd) return <span key={"b" + k} />;
              const kk = keyOf(dd), idx = byDate.get(kk), has = idx !== undefined;
              return (
                <button key={kk} disabled={!has} title={has ? "Read this day" : "No reflection this day"}
                  className={"cal-day" + (has ? " has" : "") + (kk === todayK ? " today" : "") + (has && idx === i ? " sel" : "")}
                  onClick={() => { go(idx); setTab("book"); }}>
                  {dd}{has && <i />}
                </button>
              );
            })}
          </div>
          <div className="cal-legend"><i /> {"Days with a reflection to read \u00b7 " + entries.length + " so far"}</div>
        </div>
      )}
    </Modal>
  );
}

export function TarotModal({ onClose }) {
  const card = useMemo(() => cardOfDay(), []);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { const t = setTimeout(() => setFlipped(true), 450); return () => clearTimeout(t); }, []);
  const day = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  return (
    <Modal onClose={onClose} className="tarot">
      <div className="tarot-eyebrow">Data Science Oracle · {day}</div>
      <div className={"tarot-card" + (flipped ? " is-flipped" : "")} onClick={() => setFlipped((f) => !f)}>
        <div className="tarot-face tarot-back"><span>☾</span><b>ORACLE</b></div>
        <div className="tarot-face tarot-front">
          <div className="tarot-num">{card.num}</div>
          <div className="tarot-glyph">{card.glyph}</div>
          <div className="tarot-name">{card.name}</div>
          <p className="tarot-text">“{card.text}”</p>
        </div>
      </div>
      <p className="tarot-foot">One card a day · come back tomorrow for a new reading 🔮</p>
    </Modal>
  );
}

const GUMMY = ["yum! 🍒", "so chewy~", "okay, just one more…", "these are for studying, right?", "the pack is getting lighter…"];
export function DrawerModal({ onClose }) {
  const [ate, setAte] = useState(0);
  return (
    <Modal onClose={onClose} className="drawer">
      <h2 className="drawer-h">The top drawer <span>· old college artifacts</span></h2>
      <div className="drawer-cards">
        <div className="icard"><h4>Calc I cheat sheet</h4><ul>
          <li>d/dx xⁿ = n·xⁿ⁻¹</li><li>d/dx eˣ = eˣ · d/dx ln x = 1/x</li><li>∫ xⁿ dx = xⁿ⁺¹⁄(n+1) + C</li>
          <li>chain: (f∘g)′ = f′(g)·g′</li><li>product: (fg)′ = f′g + fg′</li><li>lim<sub>x→0</sub> sin x ⁄ x = 1</li></ul></div>
        <div className="icard red"><h4>Big-O cheat sheet</h4><table><tbody>
          {[["O(1)", "hash lookup"], ["O(log n)", "binary search"], ["O(n)", "linear scan"], ["O(n log n)", "merge sort"], ["O(n²)", "nested loops"], ["O(2ⁿ)", "all subsets"]].map(([o, w]) => <tr key={o}><td>{o}</td><td>{w}</td></tr>)}
        </tbody></table></div>
      </div>
      <div className="drawer-row">
        <div className="stickers">
          <span className="stk duck">DuckDB</span><span className="stk py">Python</span><span className="stk torch">PyTorch</span><span className="stk tux">Linux</span>
        </div>
        <button className="gummy" onClick={() => setAte((n) => n + 1)}>
          <span className="gummy-pack">🍒<small>gummy cherries</small></span>
          <span className="gummy-say">{ate ? GUMMY[(ate - 1) % GUMMY.length] + " (" + ate + ")" : "have one?"}</span>
        </button>
      </div>
    </Modal>
  );
}

const NOTE_COLORS = ["#ffe58a", "#ffb3c1", "#b8e6c1", "#b9d7ff", "#f6c88f"];
export function CorkModal({ onClose }) {
  const [notes, setNotes] = useState(getNotes);
  useEffect(() => onNotes(setNotes), []);
  useEffect(() => { refreshNotes(); }, []);
  const [text, setText] = useState(""), [name, setName] = useState(""), [color, setColor] = useState(NOTE_COLORS[1]), [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const shared = isShared();
  const pin = async (e) => {
    e.preventDefault(); if (!text.trim() || busy) return;
    setBusy(true); setErr("");
    try { await addNote({ text: text.trim(), name: name.trim() || "a visitor", color }); setText(""); }
    catch { setErr("Couldn’t pin it right now. Please try again in a moment."); }
    setBusy(false);
  };
  return (
    <Modal onClose={onClose} className="cork">
      <h2 className="cork-h">📌 The note wall</h2>
      <div className="cork-grid">
        {notes.map((n, i) => (
          <div key={n.id} className={"sticky" + (open === n.id ? " is-open" : "")} style={{ background: n.color, "--r": ((i * 37) % 7 - 3) * 1.2 + "deg" }} onClick={() => setOpen(open === n.id ? null : n.id)}>
            <p>{n.text}</p><small>— {n.name}</small>
            {n.id !== "welcome" && !shared && <button className="sticky-x" onClick={(e) => { e.stopPropagation(); removeNote(n.id); }} aria-label="Remove note">×</button>}
          </div>
        ))}
      </div>
      <form className="cork-form" onSubmit={pin}>
        <textarea value={text} maxLength={140} onChange={(e) => setText(e.target.value)} placeholder="Leave some advice or encouragement…" rows={2} />
        <div className="cork-row">
          <input value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="your name (optional)" />
          {NOTE_COLORS.map((c) => <button type="button" key={c} className={"swatch" + (c === color ? " is-on" : "")} style={{ background: c }} onClick={() => setColor(c)} aria-label="Note colour" />)}
          <button className="cork-pin" type="submit" disabled={busy}>{busy ? "Pinning…" : "+ Pin note"}</button>
        </div>
        {err && <small className="cork-err">{err}</small>}
        <small className="cork-foot">{shared ? "Notes are public: everyone who visits the room can read them." : "Notes are saved in this browser."}</small>
      </form>
    </Modal>
  );
}

const PRESETS = {
  Classic: "0000000001100110011001100001100000000000101111010111111000100100",
  Kitty: "0100001001100110000000000110011000000000000110000101101000100100",
  Ghost: "0000000000100100001001000000000000111100010000100011110000000000"
};
export function CarveModal({ onClose }) {
  const [bits, setBits] = useState(() => getCarve().split(""));
  const drag = React.useRef(null);
  const paint = (i, v) => setBits((b) => { if (b[i] === v) return b; const n = [...b]; n[i] = v; return n; });
  useEffect(() => { const up = () => (drag.current = null); window.addEventListener("pointerup", up); return () => window.removeEventListener("pointerup", up); }, []);
  const save = () => { const s = bits.join(""); saveCarve(s); bus.emit("carve", s); onClose(); };
  return (
    <Modal onClose={onClose} className="carve">
      <h2 className="carve-h">🎃 Pumpkin carving station</h2>
      <p className="carve-sub">Click or drag to carve eyes and a mouth, then save it to the pumpkin by the bookshelf.</p>
      <div className="carve-pumpkin">
        <div className="carve-grid">
          {bits.map((b, i) => (
            <button key={i} className={"cell" + (b === "1" ? " cut" : "")}
              onPointerDown={(e) => { e.preventDefault(); drag.current = b === "1" ? "0" : "1"; paint(i, drag.current); }}
              onPointerEnter={() => drag.current && paint(i, drag.current)} aria-label={"cell " + i} />
          ))}
        </div>
      </div>
      <div className="carve-row">
        {Object.entries(PRESETS).map(([k, v]) => <button key={k} onClick={() => setBits(v.split(""))}>{k}</button>)}
        <button onClick={() => setBits(EMPTY_CARVE.split(""))}>Clear</button>
        <button className="carve-save" onClick={save}>Save to my pumpkin</button>
      </div>
    </Modal>
  );
}
