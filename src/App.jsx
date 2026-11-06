import React, { useRef, useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { X } from "lucide-react";
import { Experience } from "./scene/Experience.jsx";
import { HUD } from "./ui/HUD.jsx";
import { WitchModal, BookModal, JournalModal, TarotModal, DrawerModal, CorkModal, CarveModal } from "./ui/Modals.jsx";
import { NotesApp } from "./blog/NotesApp.jsx";
import { CursorTag } from "./scene/cursor.js";
import { useSkyInfo } from "./scene/skyClock.js";
import { ui, bus } from "./scene/bus.js";
import { setSoundEnabled, unlockAudio } from "./audio/keyClick.js";
import { startAmbience, getMix, setMix } from "./audio/ambience.js";
import { fetchLiveWeather } from "./scene/Weather.jsx";
import { Reader2D, AboutModal, SoundToast, RoomTour } from "./ui/Extras.jsx";
import { FrameDriver, hasWebGL, isTouch } from "./ui/perf.js";
import { TAPES, getTape, setTape } from "./audio/music.js";

const SCROLL_KEYS = { ArrowDown: 70, ArrowUp: -70, PageDown: 0.9, PageUp: -0.9, " ": 0.9, Home: -1e6, End: 1e6 };
// Eased wheel scrolling for the blog on the 3D monitor (native scrolling can't reach it through the canvas).
let wheelGoal = null, wheelRaf = 0;
function smoothScroll(el, dy) {
  const max = el.scrollHeight - el.clientHeight;
  if (wheelGoal === null) wheelGoal = el.scrollTop;
  wheelGoal = Math.max(0, Math.min(max, wheelGoal + dy));
  if (wheelRaf) return;
  const step = () => {
    const cur = el.scrollTop, d = wheelGoal - cur;
    if (Math.abs(d) < 1.5) { el.scrollTop = wheelGoal; wheelRaf = 0; wheelGoal = null; return; }
    el.scrollTop = cur + Math.sign(d) * Math.max(1.5, Math.abs(d) * 0.3);
    if (el.scrollTop === cur) { wheelRaf = 0; wheelGoal = null; return; }
    wheelRaf = requestAnimationFrame(step);
  };
  wheelRaf = requestAnimationFrame(step);
}
// A real scrollable panel (modal, tour sheet, mixer) under the cursor: let it scroll natively.
const nativeScroller = (t) => {
  for (let n = t; n && n.nodeType === 1 && n !== document.body; n = n.parentElement) {
    if (n.classList.contains("cpn") || n.classList.contains("crt")) return null;
    const o = getComputedStyle(n).overflowY;
    if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight + 1) return n;
  }
  return null;
};
const scroller = () => document.querySelector(".reader-overlay .cpn") || document.querySelector(".crt.is-active .cpn");

export default function App() {
  const [view, setViewRaw] = useState("ROOM_VIEW");
  const [modal, setModal] = useState(null);
  const [sound, setSound] = useState(true);
  useEffect(() => {
    const go = () => startAmbience();
    window.addEventListener("pointerdown", go); window.addEventListener("keydown", go);
    return () => { window.removeEventListener("pointerdown", go); window.removeEventListener("keydown", go); };
  }, []);
  const [pixel, setPixel] = useState(true);
  const [skyMode, setSkyMode] = useState("live");
  const [weather, setWeather] = useState(() => { try { return localStorage.getItem("cpn-weather") || "clear"; } catch { return "clear"; } });
  const [live, setLive] = useState({ rain: false, city: "" });
  useEffect(() => {
    try { localStorage.setItem("cpn-weather", weather); } catch {}
    if (weather !== "live") return;
    let dead = false; const get = () => fetchLiveWeather().then((w) => !dead && setLive(w));
    get(); const id = setInterval(get, 30 * 60 * 1000);
    return () => { dead = true; clearInterval(id); };
  }, [weather]);
  const rain = weather === "rain" || (weather === "live" && live.rain);
  const [witching, setWitching] = useState(false);
  const witchHour = useCallback(() => { setWitching(true); bus.emit("witching"); setTimeout(() => setWitching(false), 3600); }, []);
  useEffect(() => { if (skyMode === "midnight") { const t = setTimeout(witchHour, 600); return () => clearTimeout(t); } }, [skyMode, witchHour]);
  useEffect(() => {
    let last = "";
    const id = setInterval(() => { const d = new Date(), k = d.toDateString(); if (d.getHours() === 0 && d.getMinutes() === 0 && last !== k) { last = k; witchHour(); } }, 15000);
    if (typeof window !== "undefined") window.__room.witchHour = witchHour;
    return () => clearInterval(id);
  }, [witchHour]);
  const autoRain = useRef(false);
  useEffect(() => {
    if (rain && getMix().rain === 0) { setMix("rain", 0.5); autoRain.current = true; }
    if (!rain && autoRain.current) { setMix("rain", 0); autoRain.current = false; }
  }, [rain]);
  const [fullscreen, setFullscreen] = useState(false);
  const [deskMode, setDeskMode] = useState("desk");
  const sky = useSkyInfo(skyMode);
  const setView = useCallback((v) => { setViewRaw(v); if (v !== "COMPUTER_VIEW") setFullscreen(false); else if (isTouch()) setFullscreen(true); }, []);
  const [reader, setReaderRaw] = useState(() => /[?&]mode=(reader|2d)/.test(location.search) || !hasWebGL());
  const setReader = useCallback((on) => {
    setReaderRaw(on);
    try { const u = new URL(location.href); if (on) u.searchParams.set("mode", "reader"); else u.searchParams.delete("mode"); history.replaceState(null, "", u); } catch {}
  }, []);

  useEffect(() => { setSoundEnabled(sound); }, [sound]);
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(false); else if (modal) setModal(null); else if (view !== "ROOM_VIEW") setView("ROOM_VIEW");
        return;
      }
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (modal || /INPUT|TEXTAREA|SELECT/.test(tag) || (view !== "COMPUTER_VIEW" && !fullscreen)) return;
      const el = scroller(), amt = SCROLL_KEYS[e.key];
      if (!el || amt === undefined) return;
      e.preventDefault();
      const dy = Math.abs(amt) < 1 ? amt * el.clientHeight * (e.shiftKey ? -1 : 1) : amt;
      el.scrollBy({ top: dy, behavior: Math.abs(dy) > 1e5 ? "auto" : "smooth" });
    };
    // Mouse wheel scrolls the blog whenever the cursor is over the monitor (any view), or anywhere in the computer view.
    const onWheel = (e) => {
      if (modal || fullscreen) return;
      const over = ui.overScreen || (e.target && e.target.closest && e.target.closest(".crt"));
      if (view !== "COMPUTER_VIEW" && !over) return;
      if (nativeScroller(e.target)) return;
      const el = document.querySelector(".crt .cpn");
      if (!el) return;
      e.preventDefault();
      smoothScroll(el, e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1));
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => { window.removeEventListener("keydown", onKey, true); window.removeEventListener("wheel", onWheel, { capture: true }); };
  }, [modal, view, fullscreen, setView]);

  const openModal = useCallback((m) => setModal(m), []);
  const tour = [
    ["\u{1F5A5}\uFE0F", "Read the blog", () => setView("COMPUTER_VIEW")],
    ["\u{1F4DA}", "Bookshelf", () => setView("BOOKSHELF_VIEW")],
    ["\u{1F4D6}", "Today\u2019s notebook page", () => openModal({ type: "journal" })],
    ["\u{1F52E}", "Draw a tarot card", () => openModal({ type: "tarot" })],
    ["\u{1F5C4}\uFE0F", "Open the desk drawer", () => openModal({ type: "drawer" })],
    ["\u{1F4CC}", "Note wall", () => openModal({ type: "cork" })],
    ["\u{1F383}", "Carve the pumpkin", () => openModal({ type: "carve" })],
    ["\u{1F9F9}", "Visit the witch", () => openModal({ type: "witch" })],
    ["\u{1F9F6}", "Call the kitty", () => { setView("ROOM_VIEW"); bus.emit("yarn", { x: 0.3, z: -0.8 }); }],
    ["\u2615", "Sip the mug", () => { setView("ROOM_VIEW"); bus.emit("sip"); }],
    ["\u{1F4FC}", "Next cassette tape", () => { startAmbience(); setTape(getTape() + 1); if (getMix().music <= 0) setMix("music", 0.6); }],
    ["\u{1F327}\uFE0F", weather === "rain" ? "Stop the rain" : "Make it rain", () => setWeather(weather === "rain" ? "clear" : "rain")],
    ["\u{1F3E0}", "Back to the room", () => setView("ROOM_VIEW")]
  ];
  if (reader) return <Reader2D onExit={() => setReader(false)} />;
  return (
    <div className={"app" + (pixel ? " is-pixel" : "")}>
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 50, near: 0.05, far: 80, position: [-0.5, 3.2, 6] }}
        onCreated={({ camera }) => camera.lookAt(-0.75, 2.4, -3.1)}
      >
        <Experience view={view} setView={setView} openModal={openModal} sky={sky} fullscreen={fullscreen} pixel={pixel} rain={rain} deskMode={deskMode} />
        <FrameDriver />
      </Canvas>
      <HUD view={view} setView={setView} sound={sound} setSound={setSound} pixel={pixel} setPixel={setPixel}
        onReader={() => setReader(true)} onAbout={() => setModal({ type: "about" })} sky={sky} skyMode={skyMode} setSkyMode={setSkyMode} weather={weather} setWeather={setWeather} live={live} rain={rain} onFullscreen={() => setFullscreen(true)} deskMode={deskMode} setDeskMode={setDeskMode} />
      <CursorTag />
      <SoundToast />
      <RoomTour items={tour} />
      {witching && <div className="witching"><span>✦ the witching hour ✦</span></div>}
      {fullscreen && (
        <div className="reader-overlay" onClick={() => setFullscreen(false)}>
          <div className="reader-frame" onClick={(e) => e.stopPropagation()}>
            <button className="reader-close" onClick={() => setFullscreen(false)} aria-label="Close full screen"><X size={18} /></button>
            <NotesApp active width={Math.min(1100, window.innerWidth - 28)} />
          </div>
        </div>
      )}
      {modal && modal.type === "witch" && <WitchModal onClose={() => setModal(null)} />}
      {modal && modal.type === "book" && <BookModal book={modal.book} onClose={() => setModal(null)} />}
      {modal && modal.type === "journal" && <JournalModal onClose={() => setModal(null)} />}
      {modal && modal.type === "tarot" && <TarotModal onClose={() => setModal(null)} />}
      {modal && modal.type === "drawer" && <DrawerModal onClose={() => setModal(null)} />}
      {modal && modal.type === "cork" && <CorkModal onClose={() => setModal(null)} />}
      {modal && modal.type === "carve" && <CarveModal onClose={() => setModal(null)} />}
      {modal && modal.type === "about" && <AboutModal onClose={() => setModal(null)} />}
    </div>
  );
}
