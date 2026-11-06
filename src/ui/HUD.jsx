import React, { useState } from "react";
import { Mixer } from "./Mixer.jsx";
import { Home, Monitor, Library, Volume2, VolumeX, Grid3x3, ArrowLeft, Keyboard, BookOpen, Maximize2, Sun, Moon, Sunrise, Sunset, SlidersHorizontal, Info, ZoomIn, Coffee } from "lucide-react";
import { SKY_MODES } from "../scene/skyClock.js";

const VIEWS = [["ROOM_VIEW", Home, "Room"], ["COMPUTER_VIEW", Monitor, "Computer"], ["BOOKSHELF_VIEW", Library, "Bookshelf"]];
const HINTS = {
  ROOM_VIEW: "Sip the mug · open the drawer · draw a tarot card · swap tapes · pin a note · carve the pumpkin · click the rug for kitty · flip lamps, lights & curtains",
  BOOKSHELF_VIEW: "Glowing gold bands are books I have read · click one to open its notes · Coming soon boards are my next reads"
};
const ICONS = { Night: Moon, Dusk: Moon, Dawn: Sunrise, Sunrise: Sunrise, Sunset: Sunset };

export function HUD({ view, setView, sound, setSound, onReader, onAbout, pixel, setPixel, sky, skyMode, setSkyMode, weather, setWeather, live, rain, desk, setDesk, onFullscreen, deskMode, setDeskMode }) {
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const SkyIcon = ICONS[sky.phase] || Sun;
  const [mixer, setMixer] = useState(false);
  return (
    <>
      <div className="hud-brand">
        <div className="hud-eyebrow">{"Jasmita’s room · " + sky.phase.toLowerCase()}</div>
        <div className="hud-title">{"Cherri-Picked Notes 🍒"}</div>
      </div>
      <nav className="hud-views">
        {VIEWS.map(([v, Icon, label]) => (
          <button key={v} className={"hud-btn" + (view === v ? " is-on" : "")} onClick={() => setView(v)} title={label}>
            <Icon size={15} /><span>{label}</span>
          </button>
        ))}
        <span className="hud-sep" />
        <button className="hud-btn" onClick={onReader} title="2D reader: plain text, fast and accessible"><BookOpen size={15} /><span>2D reader</span></button>
        <button className="hud-btn icon" onClick={onAbout} title="About this room" aria-label="About this room"><Info size={15} /></button>
        <button className="hud-btn icon" onClick={() => setSound(!sound)} title={sound ? "Mute key clicks" : "Unmute key clicks"}>
          {sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
        <button className={"hud-btn icon" + (mixer ? " is-on" : "")} onClick={() => setMixer(!mixer)} title="Study soundboard (music & ambience)">
          <SlidersHorizontal size={15} />
        </button>
        <button className={"hud-btn icon" + (pixel ? " is-on" : "")} onClick={() => setPixel(!pixel)} title="Toggle pixel mode">
          <Grid3x3 size={15} />
        </button>
      </nav>
      <label className="hud-sky" title="The sky outside follows your computer's clock">
        <SkyIcon size={14} />
        <span>{skyMode === "live" ? time + " · " + sky.phase : sky.phase + " preview"}</span>
        <select value={skyMode} onChange={(e) => setSkyMode(e.target.value)} aria-label="Sky time">
          {SKY_MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={weather} onChange={(e) => setWeather(e.target.value)} aria-label="Weather" title={weather === "live" ? "Live weather" + (live.city ? " in " + live.city : "") + ": " + (rain ? "raining" : "not raining") : "Weather outside"}>
          <option value="clear">Clear</option><option value="rain">Rainy</option><option value="live">{"Live weather" + (weather === "live" ? (rain ? " · rain" : " · dry") : "")}</option>
        </select>
      </label>
      {mixer && <Mixer onClose={() => setMixer(false)} />}
      {view !== "ROOM_VIEW" && (
        <div className="hud-tools">
          <button className="hud-back" onClick={() => setView("ROOM_VIEW")}><ArrowLeft size={16} /> [ESC / Step Back]</button>
          {view === "COMPUTER_VIEW" && (
            <>
              <button className="hud-chip" onClick={() => setDeskMode(deskMode === "desk" ? "screen" : "desk")}>{deskMode === "desk" ? <ZoomIn size={15} /> : <Coffee size={15} />}<span>{deskMode === "desk" ? "Zoom into screen" : "Desk view"}</span></button>
              <button className="hud-chip" onClick={onFullscreen}><Maximize2 size={15} /><span>Full screen</span></button>
            </>
          )}
        </div>
      )}
      {HINTS[view] && <div className="hud-hint">{HINTS[view]}</div>}
    </>
  );
}
