import React, { useEffect, useMemo, useState } from "react";
import { Outside } from "./Outside.jsx";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Room } from "./Room.jsx";
import { Bookshelf } from "./Bookshelf.jsx";
import { Desk } from "./Desk.jsx";
import { Computer } from "./Computer.jsx";
import { Witch } from "./Witch.jsx";
import { JackOLantern } from "./JackOLantern.jsx";
import { Chair } from "./Chair.jsx";
import { CatLife, YarnBall } from "./Cat.jsx";
import { Cassette } from "./Cassette.jsx";
import { Weather } from "./Weather.jsx";
import { Corkboard, CarvePumpkin } from "./Corkboard.jsx";
import { Teddy } from "./Teddy.jsx";
import { WallDecor } from "./WallDecor.jsx";
import { CameraRig } from "./CameraRig.jsx";
import { deskFit } from "./layout.js";
import { Crisp, PixelComposer } from "./PixelComposer.jsx";

const mix = (a, b, t) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, t))).getHexString();

// Interior lighting follows the sky: cool daylight through the window by day, warm lamps + moonlight at night.
function SkyLights({ sky, shade = 0 }) {
  const d = sky.day * (1 - 0.8 * shade), g = sky.golden * (1 - 0.8 * shade);
  return (
    <>
      <ambientLight intensity={0.34 + d * 0.38} color={mix("#8a6f8c", "#efe3d8", d)} />
      <hemisphereLight args={[mix("#7a689c", "#d3e4f6", d), "#3a2026", 0.42 + d * 0.38]} />
      <directionalLight position={[1.8, 4.6, -7.5]} intensity={0.2 + d * 1.5 + g * 0.5} color={mix(mix("#8090d8", "#ffc890", g), "#fff2de", d)} />
      <pointLight position={[0.5, 4.3, 1.0]} intensity={6.5 - d * 2.5} distance={14} decay={1.3} color="#ffae6b" />
      <pointLight position={[1.6, 3.3, -3.3]} intensity={2 + d * 4 + g * 1.5} distance={6.5} decay={1.6} color={mix(mix("#6f7fc8", "#ef8f8a", g), "#e4ecff", d)} />
    </>
  );
}

function Expose() { const s = useThree(); useEffect(() => { if (window.__room) window.__room.three = s; }); return null; }

export function Experience({ view, setView, openModal, sky, fullscreen, pixel = true, rain = false, deskMode = "desk" }) {
  const size = useThree((s) => s.size);
  const [closed, setClosed] = useState(false);
  const fit = useMemo(() => deskFit(size.width, size.height, deskMode), [size.width, size.height, deskMode]);
  return (
    <>
      <color attach="background" args={["#1a1216"]} />
      <fog attach="fog" args={["#2a1a20", 14, 32]} />
      <SkyLights sky={sky} shade={Math.min(1, (closed ? 1 : 0) + (rain ? 0.35 : 0))} />
      <Room sky={sky} curtainsClosed={closed} onCurtains={() => setClosed((c) => !c)} />
      <Outside sky={sky} />
      <Weather rain={rain} />
      <WallDecor />
      <Crisp><Cassette /></Crisp>
      <Crisp><Corkboard onOpen={() => openModal({ type: "cork" })} /></Crisp>
      <CarvePumpkin onOpen={() => openModal({ type: "carve" })} />
      <Bookshelf onBook={(book) => openModal({ type: "book", book })} />
      <Crisp><CatLife /></Crisp>
      <YarnBall />
      <Crisp><Witch onClick={() => openModal({ type: "witch" })} /></Crisp>
      <JackOLantern position={[-3.95, 0, -2.95]} scale={1.45} seed={1} face="classic" rotation={[0, 0.3, 0]} />
      <JackOLantern position={[-3.1, 0, -2.6]} scale={1.0} seed={2} face="happy" rotation={[0, -0.25, 0]} />
      <Desk onJournal={() => openModal({ type: "journal" })} openModal={openModal} />
      <Crisp><Teddy /></Crisp>
      <Computer view={view} setView={setView} fit={fit} fullscreen={fullscreen} />
      <Chair view={view} />
      <CameraRig view={view} fit={fit} />
      <PixelComposer pixel={pixel} />
      <Expose />
    </>
  );
}
