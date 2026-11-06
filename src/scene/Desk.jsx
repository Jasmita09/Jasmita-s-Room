import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { DESK, JOURNAL } from "./layout.js";
import { journalTexture } from "./textures.js";
import { useHover } from "./cursor.js";
import { todaysEntry, parseDay, dayKey } from "../data/journal.js";
import { Crisp } from "./PixelComposer.jsx";
import { playSwitch } from "../audio/keyClick.js";
import { JackOLantern } from "./JackOLantern.jsx";
import { SteamMug, TopDrawer, TarotDeck } from "./DeskToys.jsx";

function GooseneckLamp({ lampRef }) {
  const head = new THREE.Vector3(0.6, 1.8, -3.0);
  const aim = new THREE.Vector3(JOURNAL.x, DESK.top, JOURNAL.z);
  const tube = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.25, 1.05, -3.65), new THREE.Vector3(0.22, 1.45, -3.6), new THREE.Vector3(0.3, 1.8, -3.35),
    new THREE.Vector3(0.5, 1.88, -3.08), new THREE.Vector3(0.6, 1.84, -3.0)
  ]), 40, 0.016, 6), []);
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim.clone().sub(head).normalize()), []);
  const target = useMemo(() => { const o = new THREE.Object3D(); o.position.copy(aim); return o; }, []);
  const [on, setOn] = useState(true);
  const [, bind] = useHover(true, on ? "\u{1F4A1} Click to switch the lamp off" : "\u{1F4A1} Click to switch the lamp on");
  const spot = useRef(), pt = useRef(), bulb = useRef(), lvl = useRef(1);
  useFrame((_, dt) => {
    lvl.current += ((on ? 1 : 0) - lvl.current) * Math.min(1, dt * 14);
    const l = lvl.current;
    if (spot.current) spot.current.intensity = 30 * l;
    if (pt.current) pt.current.intensity = 1.6 * l;
    if (bulb.current) { bulb.current.emissiveIntensity = 0.02 + 4 * l; bulb.current.color.set(l > 0.5 ? "#fff1cc" : "#8a7f70"); }
  });
  return (
    <group ref={lampRef} {...bind} onClick={(e) => { e.stopPropagation(); setOn(!on); playSwitch(); }}>
      <mesh position={[0.25, 1.15, -3.65]}><boxGeometry args={[0.3, 0.3, 0.3]} /><meshBasicMaterial visible={false} /></mesh>
      <mesh position={[0.45, 1.6, -3.25]}><boxGeometry args={[0.3, 0.6, 0.6]} /><meshBasicMaterial visible={false} /></mesh>
      <mesh position={head.toArray()}><sphereGeometry args={[0.17, 8, 6]} /><meshBasicMaterial visible={false} /></mesh>
      <primitive object={target} />
      <mesh position={[0.25, 1.02, -3.65]}><cylinderGeometry args={[0.12, 0.14, 0.04, 12]} /><meshStandardMaterial color="#c25934" roughness={0.5} /></mesh>
      <mesh geometry={tube}><meshStandardMaterial color="#2c2024" metalness={0.5} roughness={0.4} /></mesh>
      <group position={head.toArray()} quaternion={quat}>
        <mesh position={[0, 0.02, 0]}><coneGeometry args={[0.1, 0.16, 12, 1, true]} /><meshStandardMaterial color="#d97d46" side={THREE.DoubleSide} roughness={0.45} /></mesh>
        <mesh position={[0, -0.04, 0]}><sphereGeometry args={[0.035, 10, 8]} /><meshStandardMaterial ref={bulb} color="#fff1cc" emissive="#ffcf86" emissiveIntensity={4} toneMapped={false} /></mesh>
      </group>
      <spotLight ref={spot} position={head.toArray()} target={target} angle={0.72} penumbra={0.75} intensity={30} distance={5} decay={2} color="#ffb466" />
      <pointLight ref={pt} position={[0.62, 1.7, -2.96]} intensity={1.6} distance={1.6} decay={2} color="#ffcf86" />
    </group>
  );
}

function Journal({ onClick }) {
  const [day, setDay] = useState(dayKey());
  useEffect(() => { const id = setInterval(() => setDay(dayKey()), 30000); return () => clearInterval(id); }, []);
  const tex = useMemo(() => {
    const e = todaysEntry();
    const label = e && e.holiday ? e.holiday.toUpperCase() : e && e.date === dayKey() ? "TODAY\u2019S REFLECTION" : "LATEST REFLECTION";
    return journalTexture(e ? e.text + (e.by ? "  \u2014 " + e.by : "") : "A fresh page for today.", e ? parseDay(e.date) : new Date(), label);
  }, [day]);
  const g = useRef();
  const [hover, bind] = useHover(true, "📖 Open my notebook · today’s reflection");
  useFrame(() => {
    if (!g.current) return;
    const ty = DESK.top + (hover ? 0.025 : 0);
    g.current.position.y += (ty - g.current.position.y) * 0.2;
  });
  return (
    <group ref={g} position={[JOURNAL.x, DESK.top, JOURNAL.z]} rotation={[0, 0.16, 0]} {...bind} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, 0.009, 0]}><boxGeometry args={[0.62, 0.018, 0.42]} /><meshStandardMaterial color="#7b2d42" roughness={0.8} /></mesh>
      <mesh position={[0, 0.027, 0]}><boxGeometry args={[0.59, 0.018, 0.39]} /><meshStandardMaterial color="#f3e7d2" /></mesh>
      <mesh position={[0, 0.0366, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.59, 0.39]} />
        <meshStandardMaterial map={tex} roughness={0.9} emissive="#fff3dd" emissiveMap={tex} emissiveIntensity={hover ? 0.22 : 0.05} />
      </mesh>
      <mesh position={[0.12, 0.037, 0.24]}><boxGeometry args={[0.026, 0.002, 0.1]} /><meshStandardMaterial color="#c25934" /></mesh>
      <group position={[0.37, 0.012, 0.02]} rotation={[0, 0.3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.008, 0.008, 0.2, 6]} /><meshStandardMaterial color="#d97d46" /></mesh>
        <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.008, 0.025, 6]} /><meshStandardMaterial color="#f0d9b5" /></mesh>
      </group>
    </group>
  );
}

export function Desk({ onJournal, lampRef, openModal }) {
  const { x, z, top, width, depth } = DESK;
  const left = x - width / 2, right = x + width / 2;
  return (
    <group>
      <mesh position={[x, top - 0.035, z]}><boxGeometry args={[width, 0.07, depth]} /><meshStandardMaterial color="#9a6038" roughness={0.65} /></mesh>
      {[[left + 0.08, z - depth / 2 + 0.08], [left + 0.08, z + depth / 2 - 0.08]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, (top - 0.07) / 2, lz]}><boxGeometry args={[0.08, top - 0.07, 0.08]} /><meshStandardMaterial color="#6e4428" /></mesh>
      ))}
      <mesh position={[right - 0.45, (top - 0.07) / 2, z]}><boxGeometry args={[0.85, top - 0.07, depth - 0.1]} /><meshStandardMaterial color="#86522f" /></mesh>
      {[0.17, 0.47].map((h, i) => (
        <group key={i}>
          <mesh position={[right - 0.45, h, z + depth / 2 - 0.04]}><boxGeometry args={[0.78, 0.26, 0.02]} /><meshStandardMaterial color="#9a6038" /></mesh>
          <mesh position={[right - 0.45, h, z + depth / 2 - 0.02]}><boxGeometry args={[0.16, 0.025, 0.025]} /><meshStandardMaterial color="#c9a56a" metalness={0.7} roughness={0.3} /></mesh>
        </group>
      ))}
      <GooseneckLamp lampRef={lampRef} />
      <Crisp><Journal onClick={onJournal} /></Crisp>
      <SteamMug />
      <TopDrawer onItems={() => openModal && openModal({ type: "drawer" })} />
      <Crisp><TarotDeck onDraw={() => openModal && openModal({ type: "tarot" })} /></Crisp>
      {/* pencil cup */}
      <group position={[0.12, top, -3.15]}>
        <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.045, 0.045, 0.12, 8]} /><meshStandardMaterial color="#6b6b3a" flatShading /></mesh>
        {[["#d97d46", 0.15, 0.1], ["#7b2d42", -0.12, -0.15], ["#2a3550", 0.05, 0.25]].map(([c, rx, rz], i) => (
          <mesh key={i} position={[0, 0.16, 0]} rotation={[rx, 0, rz]}><cylinderGeometry args={[0.006, 0.006, 0.2, 5]} /><meshStandardMaterial color={c} /></mesh>
        ))}
      </group>
      {/* notebooks + plant */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[2.5, top + 0.02 + i * 0.035, -3.65]} rotation={[0, i * 0.15 - 0.1, 0]}>
          <boxGeometry args={[0.3, 0.03, 0.38]} /><meshStandardMaterial color={["#2a3550", "#e9dcc3", "#7b2d42"][i]} />
        </mesh>
      ))}
      <group position={[3.1, top, -3.72]}>
        <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.08, 0.06, 0.14, 8]} /><meshStandardMaterial color="#e9dcc3" flatShading /></mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos(i * 1.3) * 0.04, 0.24, Math.sin(i * 1.3) * 0.04]} rotation={[Math.sin(i) * 0.4, 0, Math.cos(i * 1.3) * 0.45]}>
            <coneGeometry args={[0.035, 0.26, 4]} /><meshStandardMaterial color={i % 2 ? "#6b6b3a" : "#7f8a4a"} flatShading />
          </mesh>
        ))}
      </group>
      <JackOLantern position={[2.95, top, -3.0]} rotation={[0, -0.45, 0]} scale={0.75} seed={4} face="happy" />
    </group>
  );
}
