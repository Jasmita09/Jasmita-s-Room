import React, { useEffect, useState } from "react";
import { getMix, setMix, onMix, startAmbience } from "../audio/ambience.js";
import { TAPES, getTape, setTape, onTape } from "../audio/music.js";
import { FPS_OPTIONS, getFps, setFps, onFps } from "./perf.js";

const ROWS = [["music", "\u{1F3B5}", "Lo-fi spooky music"], ["rain", "\u{1F327}\uFE0F", "Rain on the window"], ["purr", "\u{1F408}\u200D\u2B1B", "Cat purring"], ["crackle", "\u{1F56F}\uFE0F", "Crackling candles"], ["typing", "\u2328\uFE0F", "Typing clatter"]];
export function useTape() { const [t, setT] = useState(getTape()); useEffect(() => onTape(setT), []); return t; }
export function Mixer({ onClose }) {
  const [mix, set] = useState(getMix());
  const tape = useTape();
  const [fps, sf] = useState(getFps());
  useEffect(() => onFps(sf), []);
  useEffect(() => onMix(set), []);
  return (
    <div className="mixer" onPointerDown={() => startAmbience()}>
      <div className="mixer-h"><b>Soundboard &amp; settings</b><button onClick={onClose} aria-label="Close">×</button></div>
      {ROWS.map(([k, ico, label]) => (
        <label key={k} className="mixer-row">
          <span className="mixer-ico">{ico}</span><span className="mixer-lab">{label}</span>
          <input type="range" min="0" max="1" step="0.01" value={mix[k]} onChange={(e) => setMix(k, +e.target.value)} />
          <span className="mixer-val">{Math.round(mix[k] * 100)}</span>
        </label>
      ))}
      <div className="mixer-tapes">
        <span>Tape</span>
        {TAPES.map((t, i) => <button key={t.id} className={tape === i ? "is-on" : ""} style={{ "--tc": t.color }} onClick={() => setTape(i)}>{t.id} · {t.name}</button>)}
      </div>
      <label className="mixer-perf"><span>Frame rate</span>
        <select value={fps} onChange={(e) => setFps(+e.target.value)}>{FPS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </label>
      <p className="mixer-foot">Leave the room open in a background tab and study along ♡</p>
    </div>
  );
}
