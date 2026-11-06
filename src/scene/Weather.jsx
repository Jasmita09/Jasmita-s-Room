import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playThunder } from "../audio/ambience.js";

// Live weather: IP location -> Open-Meteo current weather code (free, no key).
export async function fetchLiveWeather() {
  try {
    const g = await (await fetch("https://ipapi.co/json/")).json();
    const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=weather_code`)).json();
    const c = w.current.weather_code;
    return { rain: (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95, city: g.city || "" };
  } catch { return { rain: false, city: "" }; }
}

const N = 64, M = 260, WX0 = 0.15, WX1 = 3.05, WY0 = 2.25, WY1 = 4.25;
const rx = () => WX0 + Math.random() * (WX1 - WX0), ry = () => WY0 + 0.3 + Math.random() * (WY1 - WY0 - 0.3);
// Rain on the window: droplets that bead and run down the glass, rain streaks outside, lightning + distant thunder.
export function Weather({ rain }) {
  const k = useRef(0), root = useRef(), drops = useRef(), dropMat = useRef(), veil = useRef(), lines = useRef(), light = useRef();
  const S = useMemo(() => ({ next: 5, f: 0, second: 0 }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const D = useMemo(() => Array.from({ length: N }, () => ({ x: rx(), y: ry(), s: 0.5 + Math.random() * 0.8, v: 0, run: Math.random() < 0.3 })), []);
  const seg = useMemo(() => {
    const g = new THREE.BufferGeometry(), a = new Float32Array(M * 6);
    for (let i = 0; i < M; i++) { const x = -0.6 + Math.random() * 4.4, y = 1 + Math.random() * 5, z = -4.3 - Math.random() * 2.6; a.set([x, y, z, x - 0.03, y - 0.22, z], i * 6); }
    g.setAttribute("position", new THREE.BufferAttribute(a, 3)); return g;
  }, []);
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), t = clock.elapsedTime;
    k.current = THREE.MathUtils.damp(k.current, rain ? 1 : 0, 1.2, dt);
    const on = k.current > 0.01; if (root.current) root.current.visible = on;
    if (!on) { if (light.current) light.current.intensity = 0; return; }
    D.forEach((d, i) => {
      if (d.run) {
        d.v = Math.min(0.9, d.v + dt * 0.9); d.y -= d.v * dt * (0.6 + d.s * 0.5); d.x += Math.sin(d.y * 37 + i) * 0.0006;
        if (d.y < WY0) { d.x = rx(); d.y = ry(); d.v = 0; d.run = Math.random() < 0.3; }
      } else if (Math.random() < dt * 0.12) d.run = true;
      dummy.position.set(d.x, d.y, -3.935); dummy.scale.set(d.s, d.s * (d.run ? 1.3 + d.v * 3 : 1), 0.35); dummy.updateMatrix();
      drops.current.setMatrixAt(i, dummy.matrix);
    });
    drops.current.instanceMatrix.needsUpdate = true;
    dropMat.current.opacity = 0.85 * k.current;
    const a = seg.attributes.position.array;
    for (let i = 0; i < M; i++) { let y = a[i * 6 + 1] - 7 * dt; if (y < 1) y += 5; a[i * 6 + 1] = y; a[i * 6 + 4] = y - 0.22; }
    seg.attributes.position.needsUpdate = true; lines.current.material.opacity = 0.45 * k.current;
    if (rain && t > S.next) { S.f = 1; S.second = t + 0.18; S.next = t + 10 + Math.random() * 16; setTimeout(playThunder, 700 + Math.random() * 1600); }
    if (S.second && t > S.second) { S.f = Math.max(S.f, 0.8); S.second = 0; }
    S.f = Math.max(0, S.f - dt * 6);
    veil.current.opacity = 0.42 * k.current * (1 - S.f) + S.f * 0.5;
    veil.current.color.set(S.f > 0.05 ? "#dfe6ff" : "#3e4658");
    light.current.intensity = S.f * 9;
  });
  return (
    <>
      <pointLight ref={light} position={[1.6, 3.4, -3.2]} intensity={0} distance={9} decay={1.4} color="#cfd8ff" />
      <group ref={root} visible={false}>
        <instancedMesh ref={drops} args={[null, null, N]} frustumCulled={false}>
          <sphereGeometry args={[0.019, 6, 4]} />
          <meshStandardMaterial ref={dropMat} color="#d9e8ff" emissive="#9fb8e0" emissiveIntensity={0.35} roughness={0.1} transparent opacity={0} depthWrite={false} />
        </instancedMesh>
        <mesh position={[1.6, 3.25, -3.95]} renderOrder={-1}><planeGeometry args={[3.2, 2.3]} /><meshBasicMaterial ref={veil} color="#3e4658" transparent opacity={0} depthWrite={false} fog={false} toneMapped={false} /></mesh>
        <lineSegments ref={lines} geometry={seg} frustumCulled={false}><lineBasicMaterial color="#c8d6ee" transparent opacity={0} depthWrite={false} fog={false} /></lineSegments>
      </group>
    </>
  );
}
