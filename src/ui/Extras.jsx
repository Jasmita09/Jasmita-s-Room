import React, { useEffect, useState } from "react";
import { X, Box, Compass, Volume2 } from "lucide-react";
import { NotesApp } from "../blog/NotesApp.jsx";
import { getMix } from "../audio/ambience.js";
import { isTouch } from "./perf.js";

// ── 2D reader: plain HTML, no WebGL. Fast, accessible, screen-reader and search friendly. ──
export function Reader2D({ onExit }) {
  const [w, setW] = useState(() => Math.min(1100, window.innerWidth));
  useEffect(() => { const r = () => setW(Math.min(1100, window.innerWidth)); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);
  useEffect(() => { document.title = "Cherri-Picked Notes · 2D reader"; return () => { document.title = "Cherri-Picked Notes · Jasmita Iragam"; }; }, []);
  return (
    <div className="reader2d">
      <header className="r2d-bar">
        <span className="r2d-title">Cherri-Picked Notes 🍒 <small>2D reader</small></span>
        <button className="r2d-btn" onClick={onExit}><Box size={15} /> Enter the 3D room</button>
      </header>
      <main className="r2d-main" aria-label="Cherri-Picked Notes essays"><NotesApp active width={w} /></main>
    </div>
  );
}

// ── Colophon ──
export function AboutModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal about" role="dialog" aria-modal="true" aria-label="About this room" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="about-eyebrow">Colophon · behind the scenes</div>
        <h2>About this room</h2>
        <p className="about-lede">Everything you see and hear here is generated in code. There are no downloaded 3D models, image files or audio files.</p>
        <ul className="about-list">
          <li><b>Hand-built 3D.</b> Every object, from the bookshelf and the cat to the witch and the cassette player, is assembled from procedural Three.js geometry such as boxes, spheres, tubes, tori and splines. There are no 100&nbsp;MB glTF downloads.</li>
          <li><b>Textures drawn at runtime.</b> The posters, rug, chalkboards, sticky notes and tarot cards are painted onto <code>&lt;canvas&gt;</code> elements when the page loads.</li>
          <li><b>Custom pixel-art renderer.</b> It renders in two passes. The room is drawn into a half-resolution render target and upscaled with nearest-neighbour sampling, keeping the depth buffer. The characters and text are then drawn on top at full resolution so they stay crisp.</li>
          <li><b>Synthesized sound.</b> Web Audio API graphs generate everything live: a music-box lullaby with three “tapes” of chords and tempos, convolution reverb, noise-based rain, purring, candle crackle, typing and thunder, and every click, sip and page turn.</li>
          <li><b>Astronomy math.</b> The sky follows your clock. Sun elevation is calculated from solar declination and hour angle, using your date, time and timezone (with your hemisphere guessed from daylight-saving rules). Live weather uses IP location and Open-Meteo.</li>
          <li><b>Little lives.</b> The cat runs a state-machine routine: nap, hop down, eat, drink, stroll and chase yarn. The witch and the ghost fly Catmull-Rom spline paths. A tiny event bus lets objects react to each other.</li>
          <li><b>React Three Fiber architecture.</b> The scene graph is declared as React components, with camera framing solved per viewport and the blog mounted as live HTML on the 3D monitor.</li>
          <li><b>Content pipeline.</b> Essays are written as Markdown files with frontmatter and compiled into the site at build time. The whole site ships as a single HTML file.</li>
        </ul>
        <div className="about-stack"><span>Tech stack</span>Three.js · React Three Fiber · Web Audio API · Vanilla JS</div>
        <p className="about-foot">Crafted with lots of coffee and a little help from Claude for the 3D math ☕</p>
      </div>
    </div>
  );
}

// ── "Click to enable sound" toast (browsers block audio until the first click/tap) ──
export function SoundToast() {
  const [show, setShow] = useState(() => Object.values(getMix()).some((v) => v > 0));
  useEffect(() => {
    if (!show) return;
    const off = () => setShow(false);
    window.addEventListener("pointerdown", off, { once: true }); window.addEventListener("keydown", off, { once: true });
    return () => { window.removeEventListener("pointerdown", off); window.removeEventListener("keydown", off); };
  }, [show]);
  if (!show) return null;
  return <div className="sound-toast" role="status"><Volume2 size={15} /> {isTouch() ? "Tap" : "Click"} anywhere to enable cozy sounds</div>;
}

// ── Room tour: big tap targets for every point of interest (shown on touch / small screens) ──
export function RoomTour({ items }) {
  const [open, setOpen] = useState(false);
  const [touch, setTouch] = useState(isTouch());
  useEffect(() => { const r = () => setTouch(isTouch()); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);
  return (
    <>
      <button className={"tour-fab" + (open ? " is-on" : "") + (touch ? "" : " is-desk")} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Room tour"><Compass size={20} /><span>Room tour</span></button>
      {open && (
        <div className={"tour-sheet" + (touch ? "" : " is-desk")} role="menu">
          {items.map(([ico, label, fn]) => (
            <button key={label} role="menuitem" onClick={() => { setOpen(false); fn(); }}><span>{ico}</span>{label}</button>
          ))}
        </div>
      )}
    </>
  );
}
