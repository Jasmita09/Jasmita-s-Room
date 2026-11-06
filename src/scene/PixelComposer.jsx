import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Anything inside <Crisp> is drawn at full resolution on top of the pixelated room.
export const CRISP_LAYER = 1;
export function Crisp({ children }) {
  const g = useRef();
  useFrame(() => { if (g.current) g.current.traverse((o) => o.layers.set(CRISP_LAYER)); });
  return <group ref={g}>{children}</group>;
}

// Two-pass render: 1) the room at low resolution (nearest-neighbour upscale keeps the pixel-art look),
// copied to the screen together with its depth; 2) characters, posters and text at full resolution,
// depth-tested against the room so shelves and furniture still hide them correctly.
export function PixelComposer({ pixel, factor = 0.5 }) {
  const { gl, scene, camera, size, raycaster } = useThree();
  useEffect(() => { raycaster.layers.enableAll(); }, [raycaster]);
  const rt = useMemo(() => {
    const t = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    t.depthTexture = new THREE.DepthTexture(1, 1); t.depthTexture.type = THREE.UnsignedIntType;
    return t;
  }, []);
  useEffect(() => { rt.setSize(Math.max(1, Math.round(size.width * factor)), Math.max(1, Math.round(size.height * factor))); }, [rt, size.width, size.height, factor]);
  useEffect(() => () => rt.dispose(), [rt]);
  const blit = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture } },
      vertexShader: "varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: "uniform sampler2D tColor;\nuniform sampler2D tDepth;\nvarying vec2 vUv;\nvoid main() {\n  gl_FragColor = texture2D(tColor, vUv);\n  gl_FragDepth = texture2D(tDepth, vUv).x;\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
      depthTest: false, depthWrite: true, blending: THREE.NoBlending, toneMapped: true
    });
    const s = new THREE.Scene(), mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m);
    mesh.frustumCulled = false; s.add(mesh);
    return s;
  }, [rt]);
  const lights = useRef([]), n = useRef(0);
  useFrame(() => {
    if (n.current++ % 30 === 0) { const l = []; scene.traverse((o) => { if (o.isLight) l.push(o); }); lights.current = l; }
    lights.current.forEach((l) => l.layers.enableAll());
    if (!pixel) { camera.layers.enableAll(); gl.setRenderTarget(null); gl.render(scene, camera); return; }
    camera.layers.set(0);
    gl.setRenderTarget(rt); gl.render(scene, camera);
    gl.setRenderTarget(null); gl.render(blit, camera);
    const bg = scene.background; scene.background = null;
    camera.layers.set(CRISP_LAYER);
    gl.autoClear = false; gl.render(scene, camera); gl.autoClear = true;
    scene.background = bg; camera.layers.enableAll();
  }, 1);
  return null;
}
