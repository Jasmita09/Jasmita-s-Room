import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useHover } from "./cursor.js";
import { Bubble } from "./Bubble.jsx";
import { canvasTexture } from "./textures.js";
import { TAPES, getTape, setTape, onTape } from "../audio/music.js";
import { getMix, onMix, setMix, startAmbience } from "../audio/ambience.js";
import { playSwitch } from "../audio/keyClick.js";

const labelTex = (t) => canvasTexture(128, 40, (g, w, h) => {
  g.fillStyle = "#fdf7f2"; g.fillRect(0, 0, w, h); g.fillStyle = t.color; g.fillRect(0, 0, w, 9);
  g.fillStyle = "#2c2024"; g.font = "700 14px Georgia, serif"; g.textAlign = "center"; g.fillText("Tape " + t.id + " \u00b7 " + t.name, w / 2, 28);
}, { pixel: false, hd: 3 });

// Retro boombox on the window sill: click to swap tapes (changes the music's chords + tempo).
export function Cassette({ position = [0.62, 2.21, -3.8] }) {
  const [tape, setT] = useState(getTape()), [say, setSay] = useState(null);
  const [vol, setVol] = useState(getMix().music);
  useEffect(() => onTape(setT), []); useEffect(() => onMix((m) => setVol(m.music)), []);
  const [, bind] = useHover(true, "\u{1F4FC} Swap the cassette tape");
  const tex = useMemo(() => TAPES.map(labelTex), []), reels = useRef([]), timer = useRef();
  useFrame((_, dt) => { if (vol > 0) reels.current.forEach((r) => r && (r.rotation.z -= dt * 3)); });
  const swap = (e) => {
    e.stopPropagation(); startAmbience(); playSwitch();
    const n = (getTape() + 1) % TAPES.length; setTape(n); if (getMix().music <= 0) setMix("music", 0.6);
    setSay("Tape " + TAPES[n].id + " \u00b7 " + TAPES[n].name + " \u266A");
    clearTimeout(timer.current); timer.current = setTimeout(() => setSay(null), 2400);
  };
  const dark = <meshStandardMaterial color="#2c2024" roughness={0.6} />;
  return (
    <group position={position}>
      <group {...bind} onClick={swap}>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.46, 0.2, 0.12]} /><meshStandardMaterial color="#e9dcc3" roughness={0.5} /></mesh>
        <mesh position={[0, 0.03, 0.061]}><boxGeometry args={[0.46, 0.03, 0.002]} /><meshStandardMaterial color={TAPES[tape].color} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.16, 0.11, 0.061]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.055, 0.055, 0.01, 14]} />{dark}</mesh>
            <mesh position={[0, 0, 0.006]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.01, 10]} /><meshStandardMaterial color="#5a4a40" /></mesh>
          </group>
        ))}
        <mesh position={[0, 0.115, 0.061]}><boxGeometry args={[0.15, 0.095, 0.004]} />{dark}</mesh>
        <mesh position={[0, 0.135, 0.064]}><planeGeometry args={[0.13, 0.04]} /><meshStandardMaterial map={tex[tape]} emissive="#ffffff" emissiveMap={tex[tape]} emissiveIntensity={0.2} /></mesh>
        {[-1, 1].map((s, k) => (
          <group key={k} ref={(el) => (reels.current[k] = el)} position={[s * 0.035, 0.093, 0.065]}>
            <mesh><boxGeometry args={[0.022, 0.005, 0.002]} /><meshStandardMaterial color="#fdf7f2" /></mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.022, 0.005, 0.002]} /><meshStandardMaterial color="#fdf7f2" /></mesh>
          </group>
        ))}
        <mesh position={[0, 0.235, 0]}><torusGeometry args={[0.13, 0.012, 6, 16, Math.PI]} />{dark}</mesh>
        {[-0.12, -0.06, 0.06].map((x, k) => <mesh key={k} position={[x, 0.205, 0.03]}><boxGeometry args={[0.035, 0.012, 0.03]} /><meshStandardMaterial color={k === 0 ? "#c25934" : "#5a4a40"} /></mesh>)}
        <mesh position={[0, 0.13, 0.02]}><boxGeometry args={[0.55, 0.34, 0.2]} /><meshBasicMaterial visible={false} /></mesh>
      </group>
      <Bubble text={say} position={[0, 0.62, 0.15]} scale={0.45} />
    </group>
  );
}
