import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SHELF, shelfTop } from "./layout.js";
import { useHover } from "./cursor.js";
import { bus, ui } from "./bus.js";
import { Bubble } from "./Bubble.jsx";
import { playPurr, playHiss, playBoop } from "../audio/keyClick.js";

const FUR = "#2a2431", FUR2 = "#3d3546", PINK = "#e8939f", EYE = "#cde34c";
const SCALE = 0.9, TN = 8, SEG = 0.056;
// Cat bed on the middle shelf; food + water by the wall between the shelf and the desk.
const BED = { x: SHELF.xm + 0.75, y: shelfTop(2), z: SHELF.zBack + 0.235 };
const BED_Y = BED.y + 0.045, BED_YAW = -0.75;
const EDGE = { x: BED.x + 0.12, y: shelfTop(2), z: SHELF.zFront - 0.05 };
const LAND = { x: -2.3, y: 0, z: -2.95 };
const FOOD = [-1.3, -3.52], WATER = [-0.78, -3.55];
const STROLL = [[-0.45, -2.35], [0.45, -1.55], [0.15, -0.65], [-1.05, -0.75], [-1.95, -1.7], [LAND.x, LAND.z]];
const LEGS = [[0.12, 0.055, 0], [0.12, -0.055, 0], [-0.13, 0.06, 1], [-0.13, -0.06, 1]];
const T_STAND = [1.05, 0.18, 0.12, 0.05, -0.05, -0.2, -0.32, -0.42];
const T_LOAF = [-0.55, -0.05, 0, 0, 0, 0.04, 0.04, 0.04];
const T_SCARED = [1.5, 0, 0, 0, 0, 0, 0.06, 0.12];
const lerp = (a, b, t) => a + (b - a) * t;
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

// One loop of the cat's routine: nap in the bed, hop down, eat, drink, stroll around the rug, jump back up.
function makePlan(first) {
  return [
    { k: "bed", dur: first ? 9 : 18 + Math.random() * 14 },
    { k: "walk", path: [[EDGE.x, EDGE.z]], y: EDGE.y },
    { k: "jump", from: EDGE, to: LAND, h: 0.3, dur: 0.8 },
    { k: "walk", path: [[FOOD[0], FOOD[1] + 0.31]] },
    { k: "eat", dur: 5.5, face: FOOD },
    { k: "walk", path: [[WATER[0], WATER[1] + 0.32]] },
    { k: "drink", dur: 3.5, face: WATER },
    { k: "walk", path: Math.random() < 0.8 ? STROLL : [[LAND.x, LAND.z]] },
    { k: "jump", from: LAND, to: EDGE, h: 0.38, dur: 0.85 },
    { k: "walk", path: [[BED.x, BED.z]], y: EDGE.y }
  ];
}

function CatBed() {
  return (
    <group position={[BED.x, BED.y, BED.z]}>
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.175, 0.058, 8, 22]} /><meshStandardMaterial color="#4b2a5c" roughness={0.95} /></mesh>
      <mesh position={[0, 0.022, 0]}><cylinderGeometry args={[0.19, 0.2, 0.044, 22]} /><meshStandardMaterial color="#e07b39" roughness={1} /></mesh>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <mesh key={i} position={[Math.cos(i * 0.9) * (0.05 + (i % 3) * 0.04), 0.0452, Math.sin(i * 0.9) * (0.05 + (i % 3) * 0.04)]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.012, 6]} /><meshBasicMaterial color="#2c2024" />
        </mesh>
      ))}
    </group>
  );
}

function Bowl({ x, z, color, fill, water }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.032, 0]}><cylinderGeometry args={[0.105, 0.085, 0.064, 20, 1, true]} /><meshStandardMaterial color={color} roughness={0.45} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.064, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.105, 0.009, 6, 20]} /><meshStandardMaterial color={color} roughness={0.45} /></mesh>
      <mesh position={[0, water ? 0.05 : 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.099, 20]} />
        <meshStandardMaterial color={fill} roughness={water ? 0.08 : 1} metalness={water ? 0.3 : 0} emissive={water ? "#2f6f9a" : "#000000"} emissiveIntensity={water ? 0.35 : 0} />
      </mesh>
      {!water && [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.4) * (0.02 + (i % 3) * 0.025), 0.054, Math.sin(i * 2.4) * (0.02 + (i % 3) * 0.025)]}>
          <sphereGeometry args={[0.013, 5, 4]} /><meshStandardMaterial color={i % 2 ? "#8a5a2c" : "#6b3d22"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Bowls() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[-1.04, 0.006, -3.54]}><planeGeometry args={[0.92, 0.44]} /><meshStandardMaterial color="#2c1838" roughness={1} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-1.04, 0.009, -3.54]}><planeGeometry args={[0.84, 0.36]} /><meshStandardMaterial color="#5e3a70" roughness={1} /></mesh>
      <Bowl x={FOOD[0]} z={FOOD[1]} color="#e07b39" fill="#5a3418" />
      <Bowl x={WATER[0]} z={WATER[1]} color="#3a3048" fill="#8fd0f0" water />
    </group>
  );
}

// A little black cat with a life of her own. Pet her (click or stroke with the mouse); Pumpkin Bear's "Boo!" spooks her.
export function CatLife() {
  const root = useRef(), body = useRef(), torso = useRef(), head = useRef();
  const legs = useRef([]), tail = useRef([]), tailMesh = useRef([]), eyes = useRef([]), ears = useRef([]);
  const [, bind] = useHover(true, "\u{1F43E} Pet the kitty (click or stroke)");
  const [say, setSay] = useState(null);
  const S = useMemo(() => ({
    pos: new THREE.Vector3(BED.x, BED_Y, BED.z), yaw: BED_YAW, plan: makePlan(true), step: 0, t: 0, pi: 0,
    phase: 0, walk: 0, loaf: 1, head: 0, jump: 0, pitch: 0, scared: 0, scaredT: 0, pet: 0, petT: 0, blink: 3, stroke: 0, say: null
  }), []);
  useEffect(() => bus.on("boo", () => { S.scaredT = 1.5; playHiss(); }), [S]);
  useEffect(() => { ui.catPos = S.pos; }, [S]);
  const goYarn = () => {
    const Y = S.yarn; S.yarn = null; if (!Y) return;
    const up = S.pos.y > 0.5, side = S.pos.x < Y.x ? -0.2 : 0.2;
    S.plan = [
      ...(up ? [{ k: "walk", path: [[EDGE.x, EDGE.z]], y: EDGE.y }, { k: "jump", from: EDGE, to: LAND, h: 0.3, dur: 0.8 }] : []),
      { k: "walk", path: [[Y.x + side, Y.z + 0.04]] }, { k: "play", dur: 4.5, face: [Y.x, Y.z] }, { k: "curl", dur: 11 },
      { k: "walk", path: [[LAND.x, LAND.z]] }, { k: "jump", from: LAND, to: EDGE, h: 0.38, dur: 0.85 }, { k: "walk", path: [[BED.x, BED.z]], y: EDGE.y }
    ];
    S.step = 0; S.t = 0; S.pi = 0;
  };
  useEffect(() => bus.on("yarn", (p) => { S.yarn = p; if (S.plan[S.step].k !== "jump") goYarn(); }), [S]);
  useEffect(() => bus.on("catGo", () => { if (S.plan[S.step].k === "bed") S.t = 1e3; }), [S]);
  const pet = () => {
    if (S.plan[S.step].k === "jump") return;
    if (S.petT <= 0) playPurr();
    S.petT = 2.8;
  };
  const handlers = {
    ...bind,
    onClick: (e) => { e.stopPropagation(); pet(); },
    onPointerMove: (e) => {
      const n = e.nativeEvent || e;
      S.stroke += Math.abs(n.movementX || 0) + Math.abs(n.movementY || 0);
      if (S.stroke > 180) { S.stroke = 0; pet(); }
    }
  };

  useFrame(({ clock }, rawDt) => {
    const r = root.current; if (!r) return;
    const dt = Math.min(rawDt, 0.05), time = clock.elapsedTime, k = (rate) => 1 - Math.exp(-rate * dt);
    const st = S.plan[S.step];
    const busy = (S.petT > 0 || S.scaredT > 0.3) && st.k !== "jump";
    if (!busy) S.t += dt;
    let walkT = 0, loafT = 0, headT = 0, jumpT = 0, yawT = S.yaw, yT = null;
    const next = () => { if (S.yarn) { goYarn(); return; } S.step++; S.t = 0; S.pi = 0; if (S.step >= S.plan.length) { S.plan = makePlan(false); S.step = 0; } };
    if (st.k === "bed") {
      loafT = 1; yT = BED_Y; yawT = BED_YAW;
      if (S.t > st.dur) next();
    } else if (st.k === "walk") {
      const [tx, tz] = st.path[S.pi], dx = tx - S.pos.x, dz = tz - S.pos.z, dist = Math.hypot(dx, dz);
      yT = st.y !== undefined ? st.y : 0;
      if (dist < 0.03) { S.pi++; if (S.pi >= st.path.length) next(); }
      else {
        yawT = Math.atan2(-dz, dx);
        if (!busy) {
          const m = Math.min(dist, (Math.abs(angDiff(yawT, S.yaw)) > 0.8 ? 0.1 : 0.55) * dt);
          S.pos.x += (dx / dist) * m; S.pos.z += (dz / dist) * m; S.phase += m * 24; walkT = 1;
        }
      }
    } else if (st.k === "jump") {
      const p = Math.min(1, S.t / st.dur), a = st.from, b = st.to, hd = Math.hypot(b.x - a.x, b.z - a.z);
      S.pos.set(lerp(a.x, b.x, p), lerp(a.y, b.y, p) + 4 * st.h * p * (1 - p), lerp(a.z, b.z, p));
      yawT = Math.atan2(-(b.z - a.z), b.x - a.x); jumpT = 1;
      S.pitch = THREE.MathUtils.clamp(Math.atan2(b.y - a.y + 4 * st.h * (1 - 2 * p), hd), -1.2, 1.2) * 0.5;
      if (p >= 1) next();
    } else if (st.k === "curl") {
      loafT = 1; yT = 0;
      if (S.t > st.dur) next();
    } else {
      const [bx, bz] = st.face; yawT = Math.atan2(-(bz - S.pos.z), bx - S.pos.x); headT = 1; yT = 0;
      if (S.t > st.dur) next();
    }

    S.walk += (walkT - S.walk) * k(8); S.loaf += (loafT - S.loaf) * k(st.k === "bed" ? 2.5 : 7);
    S.head += (headT - S.head) * k(5); S.jump += (jumpT - S.jump) * k(14);
    if (st.k !== "jump") S.pitch *= 1 - k(8);
    S.yaw += angDiff(yawT, S.yaw) * k(st.k === "jump" ? 18 : 6);
    if (yT !== null) S.pos.y += (yT - S.pos.y) * k(9);
    S.scaredT = Math.max(0, S.scaredT - dt); S.petT = Math.max(0, S.petT - dt);
    S.scared += ((S.scaredT > 0 ? 1 : 0) - S.scared) * k(14);
    S.pet += ((S.petT > 0 ? 1 : 0) - S.pet) * k(6);
    S.blink -= dt; if (S.blink < -0.13) S.blink = 2 + Math.random() * 4;
    ui.yarnPlay = st.k === "play";
    const sleeping = (st.k === "bed" || st.k === "curl") && S.t > 2.5 && S.petT <= 0 && S.scaredT <= 0;
    const hop = S.scaredT > 0.9 ? Math.sin(Math.PI * Math.min(1, (1.5 - S.scaredT) / 0.6)) * 0.32 : 0;
    const text = S.scaredT > 0 ? "HISS!" : S.petT > 0 ? "purrr \u2665" : st.k === "play" ? "pat pat!" : st.k === "eat" && S.t < 2.5 ? "nom nom" : st.k === "drink" && S.t < 1.8 ? "slurp" : sleeping ? "zzz" : null;
    if (text !== S.say) { S.say = text; setSay(text); }

    r.position.set(S.pos.x, S.pos.y + hop, S.pos.z); r.rotation.y = S.yaw;
    const bob = Math.sin(S.phase * 2) * 0.006 * S.walk, br = Math.sin(time * (sleeping ? 1.5 : 2.4)) * 0.01;
    body.current.position.y = -0.11 * S.loaf + bob + 0.035 * S.scared;
    body.current.rotation.z = S.pitch - 0.12 * S.head;
    torso.current.scale.set(1 + br * 0.4, 1 + br + 0.24 * S.scared - 0.05 * S.pet, 1 + br * 0.6 + 0.12 * S.scared);
    const sw = Math.sin(S.phase) * 0.6 * S.walk, tuck = lerp(1, 0.16, S.loaf) * (1 + 0.12 * S.scared), j = 0.85 * S.jump;
    [sw + j, -sw + j, -sw - j, sw - j].forEach((a, i) => { const g = legs.current[i]; if (g) { g.rotation.z = a; g.scale.y = tuck; } });
    if (st.k === "play") { const g = legs.current[LEGS.findIndex((l) => !l[2])]; if (g) { g.rotation.z = 0.5 + 0.9 * Math.max(0, Math.sin(time * 7 - 0.6)); g.scale.y = 1; } }
    const h = head.current;
    h.position.set(0.2 + 0.035 * S.head, 0.29 - 0.045 * S.loaf - 0.15 * S.head + Math.sin(time * 13) * 0.007 * S.head, 0);
    h.rotation.set(Math.sin(time * 2.2) * 0.22 * S.pet, (1 - S.loaf) * (1 - S.head) * Math.sin(time * 0.45) * 0.35, -0.62 * S.head - 0.18 * S.loaf + 0.2 * S.scared);
    const ey = sleeping || S.pet > 0.5 ? 0.12 : S.blink < 0 ? 0.15 : 1 + 0.35 * S.scared;
    eyes.current.forEach((e) => { if (e) e.scale.y += (ey - e.scale.y) * k(18); });
    const twitch = Math.max(0, Math.sin(time * 0.9) - 0.95) * 6;
    ears.current.forEach((e, i) => { if (e) { e.rotation.x = (i ? -1 : 1) * (0.25 + 0.55 * S.scared); e.rotation.z = 0.9 * S.scared + (i ? twitch * 0.4 : 0); } });
    const pf = 1 + 0.8 * S.scared;
    tail.current.forEach((g, i) => {
      if (!g) return;
      let rz = lerp(lerp(T_STAND[i], T_LOAF[i], S.loaf), T_SCARED[i], S.scared);
      rz = lerp(rz, i === 0 ? 0.25 : 0.02, S.jump * (1 - S.scared));
      g.rotation.z = rz;
      g.rotation.y = lerp(Math.sin(time * (S.pet > 0.5 ? 1.2 : 2.2) - i * 0.6) * (0.06 + i * 0.025), i ? 0.36 : 0.5, S.loaf) * (1 - S.scared);
      const m = tailMesh.current[i]; if (m) m.scale.set(pf, 1, pf);
    });
  });

  let chain = null;
  for (let i = TN - 1; i >= 0; i--) {
    const idx = i, r0 = 0.021 - idx * 0.0013;
    chain = (
      <group ref={(el) => { tail.current[idx] = el; }} position={[idx === 0 ? 0 : SEG, 0, 0]}>
        <mesh ref={(el) => { tailMesh.current[idx] = el; }} position={[SEG / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[r0, r0 - 0.0013, SEG + 0.014, 7]} /><meshStandardMaterial color={FUR} roughness={0.7} />
        </mesh>
        {chain}
      </group>
    );
  }
  const fur = <meshStandardMaterial color={FUR} roughness={0.42} metalness={0.15} emissive="#1d1726" emissiveIntensity={0.6} />;
  return (
    <group>
      <CatBed />
      <Bowls />
      <group ref={root} scale={SCALE} {...handlers}>
        <mesh position={[0.03, 0.2, 0]}><boxGeometry args={[0.64, 0.46, 0.32]} /><meshBasicMaterial visible={false} /></mesh>
        <group ref={body}>
          <group ref={torso} position={[0, 0.2, 0]}>
            <mesh scale={[0.2, 0.095, 0.1]}><sphereGeometry args={[1, 16, 12]} />{fur}</mesh>
            <mesh position={[0.12, 0.005, 0]}><sphereGeometry args={[0.088, 14, 10]} />{fur}</mesh>
            <mesh position={[-0.12, -0.005, 0]} scale={[1, 0.95, 1.05]}><sphereGeometry args={[0.1, 14, 10]} />{fur}</mesh>
            <mesh position={[0.175, -0.03, 0]} scale={[0.6, 0.85, 0.75]}><sphereGeometry args={[0.06, 10, 8]} /><meshStandardMaterial color={FUR2} roughness={0.85} /></mesh>
          </group>
          <group position={[0.17, 0.255, 0]} rotation={[0, 0, 0.55]}>
            <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.058, 0.011, 6, 18]} /><meshStandardMaterial color="#e07b39" roughness={0.6} /></mesh>
          </group>
          <mesh position={[0.205, 0.2, 0]}><sphereGeometry args={[0.016, 8, 6]} /><meshStandardMaterial color="#ffd27a" metalness={0.8} roughness={0.25} emissive="#7a5a10" emissiveIntensity={0.5} /></mesh>
          <group ref={head} position={[0.2, 0.29, 0]}>
            <mesh scale={[1.05, 0.92, 1]}><sphereGeometry args={[0.085, 16, 12]} />{fur}</mesh>
            {[1, -1].map((s) => <mesh key={"c" + s} position={[0.028, -0.03, 0.04 * s]}><sphereGeometry args={[0.048, 10, 8]} />{fur}</mesh>)}
            <mesh position={[0.072, -0.032, 0]} scale={[0.8, 0.75, 1.1]}><sphereGeometry args={[0.036, 10, 8]} /><meshStandardMaterial color={FUR2} roughness={0.85} /></mesh>
            <mesh position={[0.1, -0.015, 0]} scale={[0.7, 0.6, 1]}><sphereGeometry args={[0.012, 8, 6]} /><meshStandardMaterial color={PINK} /></mesh>
            {[1, -1].map((s, i) => (
              <group key={"e" + s} ref={(el) => { eyes.current[i] = el; }} position={[0.066, 0.014, 0.036 * s]} rotation={[0, -0.45 * s, 0]}>
                <mesh scale={[0.45, 1, 1]}><sphereGeometry args={[0.027, 12, 9]} /><meshStandardMaterial color={EYE} emissive={EYE} emissiveIntensity={0.85} toneMapped={false} /></mesh>
                <mesh position={[0.009, 0, 0]} scale={[0.4, 1, 0.3]}><sphereGeometry args={[0.019, 8, 6]} /><meshBasicMaterial color="#0b090d" /></mesh>
                <mesh position={[0.012, 0.008, 0.006 * s]}><sphereGeometry args={[0.0042, 5, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>
              </group>
            ))}
            {[1, -1].map((s, i) => (
              <group key={"r" + s} ref={(el) => { ears.current[i] = el; }} position={[-0.005, 0.066, 0.046 * s]}>
                <mesh position={[0, 0.032, 0]}><coneGeometry args={[0.036, 0.078, 4]} /><meshStandardMaterial color={FUR} roughness={0.6} flatShading /></mesh>
                <mesh position={[0.013, 0.027, 0]} scale={[0.45, 0.8, 0.7]}><coneGeometry args={[0.03, 0.06, 4]} /><meshStandardMaterial color={PINK} roughness={0.9} /></mesh>
              </group>
            ))}
            {[1, -1].map((s) => [-1, 0, 1].map((j) => (
              <mesh key={"w" + s + j} position={[0.086, -0.032 + j * 0.006, 0.05 * s]} rotation={[j * 0.16 * s, -0.25 * s, 0]}>
                <boxGeometry args={[0.0035, 0.0035, 0.1]} /><meshBasicMaterial color="#f4f0fa" />
              </mesh>
            )))}
          </group>
          <group position={[-0.2, 0.22, 0]} rotation={[0, Math.PI, 0]}>{chain}</group>
        </group>
        {LEGS.map(([x, z, back], i) => (
          <group key={i} ref={(el) => { legs.current[i] = el; }} position={[x, 0.15, z]}>
            <mesh position={[0, -0.072, 0]}><cylinderGeometry args={[back ? 0.027 : 0.022, 0.019, 0.15, 7]} />{fur}</mesh>
            <mesh position={[0.012, -0.146, 0]} scale={[1.35, 0.7, 1]}><sphereGeometry args={[0.025, 8, 6]} />{fur}</mesh>
          </group>
        ))}
        <pointLight position={[0.35, 0.45, 0.3]} intensity={0.9} distance={1.1} decay={2} color="#ffd9b0" />
        <Bubble text={say} position={[0.1, 0.68, 0]} scale={0.2} />
      </group>
    </group>
  );
}

// A yarn ball you can drop on the rug; the kitty comes over, bats at it, then curls up next to it.
export function YarnBall() {
  const g = useRef(), S = useMemo(() => ({ on: false, x: 0, z: 0, y: 0.8, vy: 0, roll: 0 }), []);
  const [vis, setVis] = useState(false);
  useEffect(() => bus.on("yarn", (p) => { S.x = p.x; S.z = p.z; S.y = 0.7; S.vy = 0; S.on = true; setVis(true); }), [S]);
  useFrame(({ clock }, raw) => {
    const o = g.current; if (!o || !S.on) return; const dt = Math.min(raw, 0.05), t = clock.elapsedTime;
    S.vy -= 9 * dt; S.y += S.vy * dt; if (S.y < 0.06) { S.y = 0.06; const sp = Math.abs(S.vy); if (sp > 0.6) playBoop(sp / 3.5); S.vy = sp > 0.6 ? sp * 0.4 : 0; }
    if (ui.yarnPlay) { const ph = Math.sin(t * 7); if (ph > 0.95 && !S.hit) { S.hit = true; playBoop(0.25); } if (ph < 0) S.hit = false; }
    const bat = ui.yarnPlay ? Math.sin(t * 7) * 0.035 : 0;
    S.roll += (ui.yarnPlay ? Math.cos(t * 7) * 0.035 * 7 : 0) * dt / 0.06;
    o.position.set(S.x + bat, S.y, S.z); o.rotation.z = -S.roll;
  });
  if (!vis) return null;
  const red = <meshStandardMaterial color="#c2263f" roughness={0.9} />;
  return (
    <group ref={g}>
      <mesh>{<sphereGeometry args={[0.06, 12, 10]} />}{red}</mesh>
      {[0, 1, 2].map((i) => <mesh key={i} rotation={[i * 1.1, i * 0.7, 0.3]}><torusGeometry args={[0.061, 0.006, 4, 20]} /><meshStandardMaterial color="#e0546a" /></mesh>)}
      <mesh position={[0.09, -0.055, 0.02]} rotation={[0, 0.4, 0]}><boxGeometry args={[0.14, 0.006, 0.008]} /><meshStandardMaterial color="#e0546a" /></mesh>
    </group>
  );
}
