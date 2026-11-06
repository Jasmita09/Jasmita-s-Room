import React, { useEffect, useMemo, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useHover } from "./cursor.js";
import { canvasTexture } from "./textures.js";
import { bus } from "./bus.js";
import { getNotes, onNotes, getCarve } from "../data/notes.js";

const corkTex = () => canvasTexture(96, 72, (g, w, h) => {
  g.fillStyle = "#b9824f"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { g.fillStyle = Math.random() < 0.5 ? "#a06c3e" : "#cc9a66"; g.fillRect(Math.random() * w | 0, Math.random() * h | 0, 1, 1); }
}, { pixel: true });
const noteTex = (n) => canvasTexture(80, 80, (g, w, h) => {
  g.fillStyle = n.color || "#ffe58a"; g.fillRect(0, 0, w, h); g.fillStyle = "#0000001a"; g.fillRect(0, h - 8, w, 8);
  g.fillStyle = "#2c2024"; g.font = "600 12px Georgia, serif";
  const words = (n.text || "").split(/\s+/); let line = "", y = 20, lines = 0;
  for (const wd of words) { const t = line ? line + " " + wd : wd; if (g.measureText(t).width > w - 12) { g.fillText(line, 6, y); y += 14; line = wd; if (++lines >= 4) { line = "\u2026"; break; } } else line = t; }
  g.fillText(line, 6, y);
}, { pixel: false, hd: 3 });

// Corkboard by the window: visitor sticky notes. Click to read them all or pin your own.
export function Corkboard({ onOpen, position = [4.15, 2.15, -3.955] }) {
  const [notes, setNotes] = useState(getNotes);
  useEffect(() => onNotes(setNotes), []);
  const [hover, bind] = useHover(true, "\u{1F4CC} Read the notes \u00b7 pin your own");
  const cork = useMemo(corkTex, []);
  const shown = notes.slice(-6);
  const tex = useMemo(() => shown.map(noteTex), [notes]);
  const slots = [[-0.3, 0.16], [0, 0.17], [0.3, 0.15], [-0.3, -0.15], [0, -0.14], [0.3, -0.16]];
  return (
    <group position={position} {...bind} onClick={(e) => { e.stopPropagation(); onOpen && onOpen(); }}>
      <mesh><boxGeometry args={[1.0, 0.74, 0.03]} /><meshStandardMaterial color="#6e4428" /></mesh>
      <mesh position={[0, 0, 0.016]}><planeGeometry args={[0.92, 0.66]} /><meshStandardMaterial map={cork} /></mesh>
      {tex.map((t, i) => (
        <group key={i} position={[slots[i][0], slots[i][1], 0.02 + i * 0.001]} rotation={[0, 0, ((i * 37) % 7 - 3) * 0.04]}>
          <mesh><planeGeometry args={[0.24, 0.24]} /><meshStandardMaterial map={t} emissive="#ffffff" emissiveMap={t} emissiveIntensity={hover ? 0.3 : 0.15} /></mesh>
          <mesh position={[0, 0.1, 0.01]}><sphereGeometry args={[0.014, 6, 5]} /><meshStandardMaterial color={["#c2263f", "#2a3550", "#6b6b3a"][i % 3]} /></mesh>
        </group>
      ))}
    </group>
  );
}

// An uncarved pumpkin by the bookshelf: carve it in the pixel grid and the face appears here.
const carveTex = (bits) => canvasTexture(64, 64, (g) => {
  for (let i = 0; i < 64; i++) if (bits[i] === "1") { const x = (i % 8) * 8, y = (i >> 3) * 8; g.fillStyle = "#3a1a08"; g.fillRect(x, y, 8, 8); g.fillStyle = "#ffd27a"; g.fillRect(x + 1, y + 1, 6, 6); }
}, { pixel: true });
export function CarvePumpkin({ onOpen, position = [-4.0, 0, -2.1] }) {
  const [bits, setBits] = useState(getCarve);
  useEffect(() => bus.on("carve", setBits), []);
  const [hover, bind] = useHover(true, "\u{1F383} Carve this pumpkin");
  const tex = useMemo(() => carveTex(bits), [bits]);
  const lit = bits.includes("1"), light = useRef(), mat = useRef();
  useFrame(({ clock }) => {
    const f = 0.85 + 0.1 * Math.sin(clock.elapsedTime * 11) + (Math.random() - 0.5) * 0.08;
    if (light.current) light.current.intensity = lit ? 1.8 * f : 0;
    if (mat.current) mat.current.emissiveIntensity = 1.4 * f;
  });
  const R = 0.3;
  return (
    <group position={position} rotation={[0, 0.45, 0]} {...bind} onClick={(e) => { e.stopPropagation(); onOpen && onOpen(); }}>
      <group position={[0, R * 0.78, 0]} scale={[1, 0.78, 1]}>
        <mesh><sphereGeometry args={[R, 16, 12]} /><meshStandardMaterial color={hover ? "#f08a3c" : "#e8772e"} roughness={0.6} flatShading /></mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} rotation={[0, (i / 6) * Math.PI, 0]} scale={[0.25, 1, 1.0]}><sphereGeometry args={[R * 1.004, 12, 10]} /><meshStandardMaterial color="#d8692a" roughness={0.6} flatShading /></mesh>)}
        <mesh><sphereGeometry args={[R * 1.03, 24, 16, Math.PI / 2 - 0.85, 1.7, 0.6, 1.45]} /><meshStandardMaterial ref={mat} map={tex} emissiveMap={tex} emissive="#ffb347" transparent alphaTest={0.5} /></mesh>
      </group>
      <mesh position={[0, R * 1.62, 0]} rotation={[0.1, 0, 0.2]}><cylinderGeometry args={[0.025, 0.04, 0.12, 6]} /><meshStandardMaterial color="#5b5a2a" flatShading /></mesh>
      <pointLight ref={light} position={[0, R * 0.8, 0.12]} color="#ff9b3d" distance={2.4} decay={2} intensity={0} />
    </group>
  );
}
