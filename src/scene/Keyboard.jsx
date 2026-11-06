import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { KEYBOARD } from "./layout.js";
import { playKeyClick } from "../audio/keyClick.js";

// [code, widthInUnits]; null code = spacer
const K = (list) => list.map((c) => (Array.isArray(c) ? c : [c, 1]));
const ROWS = [
  K([["Escape", 1], [null, 0.5], "F1", "F2", "F3", "F4", [null, 0.25], "F5", "F6", "F7", "F8", [null, 0.25], "F9", "F10", "F11", "F12", [null, 1]]),
  K(["Backquote", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", ["Backspace", 2]]),
  K([["Tab", 1.5], "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", ["Backslash", 1.5]]),
  K([["CapsLock", 1.75], "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", ["Enter", 2.25]]),
  K([["ShiftLeft", 2.25], "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", ["ShiftRight", 2.75]]),
  K([["ControlLeft", 1.5], ["MetaLeft", 1.25], ["AltLeft", 1.25], ["Space", 6.5], ["AltRight", 1.25], ["MetaRight", 1.25], ["ControlRight", 2]])
];
const ALIAS = { NumpadEnter: "Enter", OSLeft: "MetaLeft", OSRight: "MetaRight", ContextMenu: "MetaRight" };
const MODS = new Set(["Tab", "CapsLock", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "Backspace", "Backslash"]);
function capColor(code) {
  if (code === "Enter") return "#d97d46";
  if (code === "Space") return "#c25934";
  if (code === "Escape") return "#7b2d42";
  if (code.startsWith("F") && code.length <= 3) return "#e9e2d9";
  if (MODS.has(code)) return "#ddd4ca";
  return "#f6f1ea";
}

export function Keyboard({ active, onWake }) {
  const u = KEYBOARD.unit;
  const keys = useRef({});
  const activeRef = useRef(active);
  activeRef.current = active;

  const layout = useMemo(() => {
    const out = [];
    ROWS.forEach((row, r) => {
      let x = -7.5;
      row.forEach(([code, w]) => {
        if (code) out.push({ code, w, x: (x + w / 2) * u, z: (r - 2.5) * u * 1.02 });
        x += w;
      });
    });
    return out;
  }, []);

  const press = (code, on, sound) => {
    const k = keys.current[code];
    if (!k) return;
    if (on && !k.pressed && sound) playKeyClick(k.w >= 2 ? "wide" : "key");
    k.pressed = on;
  };

  useEffect(() => {
    const down = (e) => { if (!activeRef.current) return; press(ALIAS[e.code] || e.code, true, !e.repeat); };
    const up = (e) => press(ALIAS[e.code] || e.code, false);
    const blur = () => Object.values(keys.current).forEach((k) => { k.pressed = false; });
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);

  useFrame((_, dt) => {
    const a = 1 - Math.exp(-Math.min(dt, 0.05) * 32);
    for (const code in keys.current) {
      const k = keys.current[code];
      if (!k.mesh) continue;
      const ty = k.base + (k.pressed ? -0.007 : 0);
      k.mesh.position.y += (ty - k.mesh.position.y) * a;
      const te = k.pressed ? 1.1 : 0;
      k.mesh.material.emissiveIntensity += (te - k.mesh.material.emissiveIntensity) * a * 0.6;
    }
  });

  const caseH = 0.016, capH = 0.012, base = caseH + capH / 2 + 0.002;
  return (
    <group position={[KEYBOARD.x, KEYBOARD.y, KEYBOARD.z]} rotation={[0.03, 0, 0]}
      onClick={(e) => { if (!activeRef.current) { e.stopPropagation(); onWake && onWake(); } }}>
      <mesh position={[0, caseH / 2, 0]}><boxGeometry args={[15.6 * u, caseH, 6.7 * u]} /><meshStandardMaterial color="#b9b4b0" metalness={0.5} roughness={0.6} /></mesh>
      {layout.map((k) => (
        <mesh key={k.code} position={[k.x, base, k.z]}
          ref={(el) => { if (el) keys.current[k.code] = Object.assign(keys.current[k.code] || {}, { mesh: el, w: k.w, base }); }}
          onPointerDown={(e) => { if (!activeRef.current) return; e.stopPropagation(); press(k.code, true, true); }}
          onPointerUp={() => press(k.code, false)}
          onPointerOut={() => press(k.code, false)}>
          <boxGeometry args={[k.w * u - 0.008, capH, u - 0.008]} />
          <meshStandardMaterial color={capColor(k.code)} emissive="#ff9a3c" emissiveIntensity={0} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}
