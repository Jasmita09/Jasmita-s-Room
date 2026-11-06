import React, { Fragment, useEffect, useRef, useState } from "react";
import { ArrowRight, Mail, Linkedin, Globe } from "lucide-react";
import { DISPATCHES } from "../data/dispatchesData.js";
import { SITE, FILTERS } from "../data/siteMeta.js";
import { Discussion } from "./Discussion.jsx";
import { Newsletter } from "./Newsletter.jsx";

function TopBar({ onHome }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(t); }, []);
  return (
    <div className="cpn-bar">
      <span className="cpn-dots"><i style={{ background: "#7b2d42" }} /><i style={{ background: "#d97d46" }} /><i style={{ background: "#6b6b3a" }} /></span>
      <button className="cpn-bar-title" onClick={onHome}>cherri-os ▸ notes.html</button>
      <span className="cpn-bar-time">{now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
    </div>
  );
}

function DispatchCard({ d, onOpen }) {
  return (
    <article className={"cpn-card" + (d.isDraft ? " is-draft" : "")}>
      <div className="cpn-card-top">
        <span className="cpn-badge">{d.badge}</span>
        {d.isDraft && <span className="cpn-draft-badge">{d.statusText}</span>}
      </div>
      <div className="cpn-meta">
        <time dateTime={d.isDraft ? undefined : "2026-10"}>{d.date}</time>
        {d.readingTime && <><span>·</span><span>{d.readingTime}</span></>}
        {d.location && <><span>·</span><span>{d.location}</span></>}
      </div>
      <h2 className="cpn-card-title">{d.title}</h2>
      <p className="cpn-card-sub">{d.subtitle || d.deck}</p>
      <div className="cpn-card-foot">
        <span className="cpn-cat">{d.categoryLabel}</span>
        {d.isDraft
          ? <button className="cpn-btn is-ghost" disabled>Coming Soon</button>
          : <button className="cpn-btn" onClick={() => onOpen(d.id)}>Read Note <ArrowRight size={14} /></button>}
      </div>
    </article>
  );
}

function Archive({ filter, setFilter, onOpen }) {
  const f = FILTERS.find((x) => x.id === filter) || FILTERS[0];
  const list = DISPATCHES.filter(f.match);
  return (
    <section>
      <header className="cpn-hero">
        <div className="cpn-eyebrow">{SITE.eyebrow}</div>
        <h1 className="cpn-title">{SITE.title}</h1>
        <p className="cpn-desc">{SITE.description}</p>
      </header>
      <div className="cpn-pills" role="tablist">
        {FILTERS.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === filter} className={"cpn-pill" + (x.id === filter ? " is-on" : "")} onClick={() => setFilter(x.id)}>{x.label}</button>
        ))}
      </div>
      <div className="cpn-cards">
        {list.map((d) => <DispatchCard key={d.id} d={d} onOpen={onOpen} />)}
        {list.length === 0 && <p className="cpn-empty">No notes here yet.</p>}
      </div>
    </section>
  );
}

function Article({ d }) {
  const paras = d.paragraphs || [];
  return (
    <article className="cpn-article">
      <span className="cpn-badge">{d.badge}</span>
      <div className="cpn-meta"><time>{d.date}</time><span>·</span><span>{d.readingTime}</span><span>·</span><span>{d.location}</span></div>
      <h1>{d.title}</h1>
      <p className="cpn-subtitle">{d.subtitle}</p>
      <hr className="cpn-rule" />
      {d.quoteBox && (
        <figure className="cpn-quote-box">
          <blockquote>{d.quoteBox.quote}</blockquote>
          <figcaption>{d.quoteBox.author}</figcaption>
        </figure>
      )}
      {paras.map((p, i) => (
        <Fragment key={i}>
          <p className={i === 0 ? "cpn-drop" : undefined}>{p}</p>
          {d.pullQuote && i === 1 && <blockquote className="cpn-pull">{d.pullQuote}</blockquote>}
        </Fragment>
      ))}
      {d.tributeCard && (
        <aside className="cpn-tribute">
          <span className="cpn-tribute-label">{d.tributeCard.label}</span>
          <p>{d.tributeCard.body}</p>
          <a href={d.tributeCard.linkUrl} target="_blank" rel="noreferrer">Visit {d.tributeCard.linkText} ↗</a>
        </aside>
      )}
      {d.closingText && <p>{d.closingText}</p>}
      {d.signoff && <p className="cpn-signoff">{d.signoff}</p>}
    </article>
  );
}

function Reader({ id, onBack, onOpen }) {
  const d = DISPATCHES.find((x) => x.id === id) || DISPATCHES[0];
  return (
    <section className="cpn-reader">
      <button className="cpn-back" onClick={onBack}>← Back to all notes</button>
      <div className="cpn-reader-grid">
        <div className="cpn-main">
          <Article d={d} />
          <Discussion dispatchId={d.id} />
        </div>
        <aside className="cpn-index">
          <div className="cpn-index-inner">
            <div className="cpn-index-label">Dispatch Index</div>
            <ol>
              {DISPATCHES.map((x) => (
                <li key={x.id} className={x.id === d.id ? "is-current" : ""}>
                  <button disabled={x.isDraft} onClick={() => onOpen(x.id)}>
                    <span className="num">{x.num}</span>
                    <span className="t">{x.title}</span>
                    {x.isDraft && <em>{x.statusText}</em>}
                  </button>
                </li>
              ))}
            </ol>
            <div className="cpn-index-author">
              <div className="cpn-index-label">About the author</div>
              {SITE.bio}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SiteFooter() {
  const c = SITE.contact;
  return (
    <footer className="cpn-footer">
      <div className="cpn-footer-grid">
        <div>
          <h4>About</h4>
          <p>{SITE.bio}</p>
          <h4>Featured Projects</h4>
          <div className="cpn-chips">{SITE.projects.map((p) => <span key={p} className="cpn-chip">{p}</span>)}</div>
        </div>
        <div>
          <h4>Say hello</h4>
          <div className="cpn-contact">
            <a href={"mailto:" + c.email}><Mail size={13} /> {c.email}</a>
            <a href={c.linkedin} target="_blank" rel="noreferrer"><Linkedin size={13} /> LinkedIn</a>
            <a href={c.portfolio} target="_blank" rel="noreferrer"><Globe size={13} /> Portfolio</a>
          </div>
        </div>
      </div>
      <div className="cpn-affil">{SITE.affiliation}</div>
    </footer>
  );
}

// The full "Cherri-Picked Notes" app, rendered inside the CRT via <Html transform occlude>.
export function NotesApp({ active, width = 900 }) {
  const [route, setRoute] = useState({ name: "archive" });
  const [filter, setFilter] = useState("all");
  const scroller = useRef(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = 0; }, [route]);
  const open = (id) => setRoute({ name: "reader", id });
  const home = () => setRoute({ name: "archive" });
  return (
    <div className={"cpn" + (active ? " is-active" : "") + (width < 760 ? " is-narrow" : "")} ref={scroller}>
      <TopBar onHome={home} />
      {route.name === "archive"
        ? <Archive filter={filter} setFilter={setFilter} onOpen={open} />
        : <Reader id={route.id} onBack={home} onOpen={open} />}
      <Newsletter />
      <SiteFooter />
    </div>
  );
}
