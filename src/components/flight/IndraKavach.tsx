'use client';

import { forwardRef, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useFrame } from '@react-three/fiber';

// Procedural IndraKavach, modelled from SenseImage's CAD renders: a capsule fuselage, four ducted
// coaxial rotor pods on short stub arms, a dark nose sensor and a canopy strip. Nose points +X,
// up is +Y, starboard is +Z. Overall length 2.6 units.

export const LENGTH = 2.6;
const HALF = LENGTH / 2;
const POD_X = 0.66;
const POD_Z = 0.69;
const DUCT_IN = 0.352;
const DUCT_OUT = 0.43;

/** Live inputs written by the flight rig every frame. */
export type DroneFx = {
  rotor: number;
  explode: number;
  thermal: number;
  /** 0..1 thermal sweep from tail to nose, used by the EO/IR step. */
  scan: number;
  time: number;
};

// ---------- Shared shader hooks: optical <-> EO/IR blend ----------

const shared = {
  uThermal: { value: 0 },
  uScan: { value: -9 },
  uTime: { value: 0 },
  uDroneInv: { value: new THREE.Matrix4() },
};

/** Thermal palette: phosphor "white-hot", matching the site's night imagery. */
const PALETTE_GLSL = /* glsl */ `
vec3 siPalette(float h) {
  vec3 c0 = vec3(0.008, 0.030, 0.040);
  vec3 c1 = vec3(0.020, 0.200, 0.200);
  vec3 c2 = vec3(0.040, 0.560, 0.500);
  vec3 c3 = vec3(0.330, 0.950, 0.840);
  vec3 c4 = vec3(0.930, 1.000, 0.980);
  if (h < 0.25) return mix(c0, c1, h / 0.25);
  if (h < 0.5) return mix(c1, c2, (h - 0.25) / 0.25);
  if (h < 0.75) return mix(c2, c3, (h - 0.5) / 0.25);
  return mix(c3, c4, (h - 0.75) / 0.25);
}`;

function thermalize<T extends THREE.MeshStandardMaterial>(mat: T, heat: number): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uThermal = shared.uThermal;
    shader.uniforms.uScan = shared.uScan;
    shader.uniforms.uTime = shared.uTime;
    shader.uniforms.uDroneInv = shared.uDroneInv;
    shader.uniforms.uHeat = { value: heat };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uDroneInv;\nvarying vec3 vSiP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSiP = (uDroneInv * modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uThermal;
uniform float uScan;
uniform float uTime;
uniform float uHeat;
varying vec3 vSiP;
${PALETTE_GLSL}`,
      )
      .replace(
        '#include <colorspace_fragment>',
        `#include <colorspace_fragment>
{
  vec3 siV = normalize(vViewPosition);
  float siFres = pow(1.0 - abs(dot(normal, siV)), 2.0);
  float siLam = clamp(dot(normal, normalize(vec3(0.35, 0.8, 0.45))), 0.0, 1.0);
  float siH = clamp(uHeat + 0.16 * siLam + 0.26 * siFres - 0.06, 0.0, 1.0);
  float siMask = max(uThermal, step(vSiP.x, uScan));
  gl_FragColor.rgb = mix(gl_FragColor.rgb, siPalette(siH), siMask);
  float siLine = exp(-pow((vSiP.x - uScan) * 22.0, 2.0)) * step(-1.6, uScan) * step(uScan, 1.6);
  gl_FragColor.rgb += vec3(0.35, 1.0, 0.88) * siLine * 0.9;
}`,
      );
  };
  mat.customProgramCacheKey = () => 'si-thermal';
  return mat;
}

// ---------- Geometry ----------

/** Fuselage radius along the body, t from -1 (tail) to 1 (nose). Blunt nose, longer taper aft. */
function bodyRadius(t: number) {
  const n = t > 0 ? 3.4 : 2.3;
  const k = 1 - Math.pow(Math.min(1, Math.abs(t)), n);
  // A faint waist between the pod junctions, as on the CAD model.
  const waist = 1 - 0.035 * Math.exp(-Math.pow(t * 3.2, 2));
  return 0.195 * Math.pow(Math.max(0, k), 1 / 2.3) * waist;
}

/** Profile points for a lathe around +Y, mapped to the body axis afterwards. */
function bodyProfile(from: number, to: number, grow = 0, steps = 72) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    // Cosine spacing packs points into the rounded ends.
    const u = i / steps;
    const s = from + (to - from) * (0.5 - 0.5 * Math.cos(Math.PI * u));
    pts.push(new THREE.Vector2(Math.max(0.0001, bodyRadius(s) + grow), s * HALF));
  }
  return pts;
}

/** Lathe around +Y, turned so the lathe axis becomes the +X body axis. */
function bodyLathe(from: number, to: number, grow = 0, phiStart = 0, phiLength = Math.PI * 2, radial = 72) {
  const g = new THREE.LatheGeometry(bodyProfile(from, to, grow), radial, phiStart, phiLength);
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** Duct ring: a rounded lip section revolved around the pod's vertical axis. */
function ductGeometry() {
  const ri = DUCT_IN;
  const ro = DUCT_OUT;
  const h = 0.06;
  const r = 0.022;
  const pts: THREE.Vector2[] = [];
  const arc = (cx: number, cy: number, a0: number, a1: number, n = 8) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
  };
  // Counter-clockwise around the section: outer-bottom, outer-top, inner-top lip, inner-bottom.
  arc(ro - r, -h + r, -Math.PI / 2, 0);
  arc(ro - r, h - r, 0, Math.PI / 2);
  arc(ri + r * 1.4, h - r * 0.4, Math.PI / 2, Math.PI, 10);
  arc(ri + r, -h + r, Math.PI, Math.PI * 1.5);
  pts.push(pts[0].clone());
  return new THREE.LatheGeometry(pts, 96);
}

/** Tapered, twisted blade from the hub outwards along +X. */
function bladeGeometry() {
  const g = new THREE.BoxGeometry(0.29, 0.007, 0.05, 12, 1, 1);
  g.translate(0.145 + 0.04, 0, 0);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const u = (v.x - 0.04) / 0.29;
    const taper = 1 - 0.5 * u;
    const twist = 0.42 - 0.3 * u;
    const z = v.z * taper;
    const y = v.y;
    v.y = y * Math.cos(twist) - z * Math.sin(twist);
    v.z = y * Math.sin(twist) + z * Math.cos(twist);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function buildGeometry() {
  const beam = new THREE.CylinderGeometry(0.017, 0.017, DUCT_IN * 2, 12);
  beam.rotateZ(Math.PI / 2);
  const arm = new THREE.CylinderGeometry(0.046, 0.05, POD_Z - DUCT_OUT - 0.08, 20);
  arm.rotateX(Math.PI / 2);
  const collar = new THREE.CylinderGeometry(0.066, 0.066, 0.05, 24);
  collar.rotateX(Math.PI / 2);
  const ventSide = new RoundedBoxGeometry(0.16, 0.045, 0.02, 3, 0.012);
  const port = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16);
  port.rotateX(Math.PI / 2);
  const groove = new THREE.BoxGeometry(0.012, 0.1, 0.03);
  const disc = new THREE.RingGeometry(0.06, DUCT_IN - 0.012, 64, 1);
  disc.rotateX(-Math.PI / 2);
  const antenna = new THREE.CylinderGeometry(0.005, 0.008, 0.16, 8);
  return {
    body: bodyLathe(-1, 1),
    // Dark glass nose cap and canopy strip sit a hair proud of the hull.
    nose: bodyLathe(0.9, 1, 0.003),
    canopy: bodyLathe(-0.36, 0.3, 0.004, Math.PI * 1.5 - 0.42, 0.84, 48),
    hatch: new RoundedBoxGeometry(0.4, 0.05, 0.19, 4, 0.02),
    payload: new RoundedBoxGeometry(0.38, 0.08, 0.15, 4, 0.03),
    gimbal: new THREE.SphereGeometry(0.075, 32, 24),
    lens: new THREE.CircleGeometry(0.034, 24),
    duct: ductGeometry(),
    groove,
    beam,
    arm,
    collar,
    motor: new THREE.CylinderGeometry(0.052, 0.058, 0.07, 24),
    bell: new THREE.CylinderGeometry(0.046, 0.05, 0.022, 24),
    spinner: new THREE.ConeGeometry(0.026, 0.045, 16),
    blade: bladeGeometry(),
    disc,
    ventSide,
    port,
    antenna,
    light: new THREE.SphereGeometry(0.022, 12, 8),
  };
}

let geometryCache: ReturnType<typeof buildGeometry> | null = null;
const geometry = () => (geometryCache ??= buildGeometry());

// ---------- Materials ----------

function discMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uSpin: { value: 0 }, uAmount: { value: 1 }, uThermal: shared.uThermal },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() {
        vP = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec2 vP;
      uniform float uSpin;
      uniform float uAmount;
      uniform float uThermal;
      void main() {
        float r = length(vP) / ${DUCT_IN.toFixed(3)};
        float a = atan(vP.y, vP.x);
        float streak = 0.55 + 0.45 * sin(a * 3.0 - uSpin);
        float ring = smoothstep(0.16, 0.34, r) * (1.0 - smoothstep(0.86, 0.97, r));
        float alpha = ring * (0.08 + 0.12 * streak * r) * uAmount;
        vec3 col = mix(vec3(0.07, 0.08, 0.09), vec3(0.3, 1.0, 0.86), uThermal);
        gl_FragColor = vec4(col, alpha * mix(1.0, 0.7, uThermal));
      }`,
  });
}

function buildMaterials() {
  return {
    body: thermalize(
      new THREE.MeshPhysicalMaterial({ color: '#eef1f4', roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.15 }),
      0.36,
    ),
    duct: thermalize(
      new THREE.MeshPhysicalMaterial({ color: '#e9ecef', roughness: 0.34, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 1.05 }),
      0.32,
    ),
    glass: thermalize(
      new THREE.MeshPhysicalMaterial({ color: '#06090d', roughness: 0.06, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 }),
      0.55,
    ),
    carbon: thermalize(new THREE.MeshStandardMaterial({ color: '#202429', roughness: 0.42, metalness: 0.55 }), 0.5),
    metal: thermalize(new THREE.MeshStandardMaterial({ color: '#c4c9cf', roughness: 0.22, metalness: 1 }), 0.72),
    motor: thermalize(new THREE.MeshStandardMaterial({ color: '#2b2f35', roughness: 0.35, metalness: 0.8 }), 0.96),
    blade: thermalize(new THREE.MeshStandardMaterial({ color: '#0e1013', roughness: 0.55, metalness: 0.2 }), 0.22),
    hatch: thermalize(
      new THREE.MeshPhysicalMaterial({ color: '#dfe3e7', roughness: 0.4, metalness: 0, clearcoat: 0.6, envMapIntensity: 1 }),
      0.84,
    ),
    port: new THREE.MeshBasicMaterial({ color: '#ff3b30' }),
    starboard: new THREE.MeshBasicMaterial({ color: '#22e07a' }),
    strobe: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  };
}

let materialCache: ReturnType<typeof buildMaterials> | null = null;
const materials = () => (materialCache ??= buildMaterials());

const PODS: [number, number][] = [
  [POD_X, -POD_Z],
  [POD_X, POD_Z],
  [-POD_X, -POD_Z],
  [-POD_X, POD_Z],
];

const RED = new THREE.Color('#ff3b30');
const GREEN = new THREE.Color('#22e07a');
const HOT = new THREE.Color('#eafffb');

type Props = {
  /** Written by the flight rig every frame; read here inside the frame loop. */
  fx: { readonly current: DroneFx };
  /** Swarm wingmen drop the small parts. */
  lite?: boolean;
  /** The flight rig owns the thermal uniforms; wingmen only read them. */
  primary?: boolean;
};

const IndraKavach = forwardRef<THREE.Group, Props>(function IndraKavach({ fx, lite = false, primary = false }, ref) {
  const g = geometry();
  const m = materials();
  const root = useRef<THREE.Group>(null);
  const pods = useRef<(THREE.Group | null)[]>([]);
  const rotors = useRef<(THREE.Group | null)[]>([]);
  const discs = useRef<(THREE.Mesh | null)[]>([]);
  const hatch = useRef<THREE.Mesh>(null);
  const payload = useRef<THREE.Mesh>(null);
  const nose = useRef<THREE.Group>(null);
  const strobe = useRef<THREE.Mesh>(null);
  const spin = useRef(0);
  // One blur disc material per pod, shared by its upper and lower rotor; animated through the mesh refs.
  const discMats = useMemo(() => PODS.map(() => discMaterial()), []);

  useFrame((_, dt) => {
    const input = fx.current;
    const e = input.explode;
    spin.current += dt * (6 + 34 * input.rotor);
    rotors.current.forEach((r, i) => {
      if (!r) return;
      // Coaxial pairs counter-rotate, neighbouring pods alternate, and each pod is offset so blades never line up.
      const below = i >= 4;
      const dir = ((i % 4) % 2 === 0 ? 1 : -1) * (below ? -1 : 1);
      r.rotation.y = dir * spin.current + i * 0.7;
      r.position.y = (below ? -0.05 : 0.05) + (below ? -0.1 : 0.14) * e;
    });
    discs.current.forEach((d, i) => {
      if (!d) return;
      const u = (d.material as THREE.ShaderMaterial).uniforms;
      u.uSpin.value = spin.current * 0.6 + i;
      u.uAmount.value = Math.min(1, input.rotor * 0.9) * (1 - e * 0.8);
    });
    pods.current.forEach((p, i) => {
      if (!p) return;
      const [x, z] = PODS[i];
      p.position.set(x * (1 + 0.12 * e), 0.06 * e, z + Math.sign(z) * 0.42 * e);
    });
    if (hatch.current) hatch.current.position.y = bodyRadius(-0.04) + 0.006 + 0.3 * e;
    if (payload.current) payload.current.position.y = -bodyRadius(0.04) - 0.02 - 0.34 * e;
    if (nose.current) nose.current.position.x = 0.3 * e;

    if (!primary) return;
    shared.uTime.value = input.time;
    shared.uThermal.value = input.thermal;
    // Deadbands: the eased pose only approaches 0 and 1, and anything behind the lead (wingmen) must stay optical.
    shared.uScan.value = input.scan < 0.02 ? -9 : input.scan > 0.98 ? 9 : -1.5 + 3 * input.scan;
    if (root.current) shared.uDroneInv.value.copy(root.current.matrixWorld).invert();
    const t = input.thermal;
    m.port.color.copy(RED).lerp(HOT, t);
    m.starboard.color.copy(GREEN).lerp(HOT, t);
    if (strobe.current) strobe.current.visible = (input.time % 1.6) < 0.08;
  });

  const setRef = (el: THREE.Group | null) => {
    root.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  const tail = -HALF + 0.12;

  return (
    <group ref={setRef}>
      <mesh geometry={g.body} material={m.body} />
      <group ref={nose}>
        <mesh geometry={g.nose} material={m.glass} />
        <mesh geometry={g.gimbal} material={m.glass} position={[1.0, -0.15, 0]} />
        {!lite && <mesh geometry={g.lens} material={m.metal} position={[1.077, -0.152, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.55} />}
      </group>
      <mesh geometry={g.canopy} material={m.glass} />
      <mesh ref={hatch} geometry={g.hatch} material={m.hatch} position={[-0.04, bodyRadius(-0.04) + 0.006, 0]} />
      <mesh ref={payload} geometry={g.payload} material={m.carbon} position={[0.04, -bodyRadius(0.04) - 0.02, 0]} />

      {!lite &&
        [-1, 1].map((side) => (
          <group key={side}>
            <mesh geometry={g.ventSide} material={m.glass} position={[0.86, 0.035, side * (bodyRadius(0.66) + 0.002)]} />
            <mesh geometry={g.ventSide} material={m.glass} position={[-0.86, 0.02, side * (bodyRadius(-0.66) + 0.002)]} scale={[0.7, 1, 1]} />
            <mesh geometry={g.port} material={m.glass} position={[1.02, 0.03, side * (bodyRadius(0.78) + 0.002)]} />
            <mesh geometry={g.port} material={m.glass} position={[-0.62, 0.04, side * (bodyRadius(-0.48) + 0.002)]} />
          </group>
        ))}
      {!lite && <mesh geometry={g.antenna} material={m.carbon} position={[-0.92, bodyRadius(-0.71) + 0.07, 0]} />}

      {PODS.map(([x, z], i) => {
        const side = Math.sign(z);
        const armLen = POD_Z - DUCT_OUT - 0.08;
        return (
          <group key={i}>
            {/* Stub arm and collar stay on the hull; the pod rides out on explode. */}
            <mesh geometry={g.collar} material={m.duct} position={[x, 0, side * (bodyRadius(x / HALF) - 0.005)]} />
            <mesh geometry={g.arm} material={m.duct} position={[x, 0, side * (0.1 + armLen / 2 + 0.05)]} />
            <group ref={(el) => void (pods.current[i] = el)} position={[x, 0, z]}>
              <mesh geometry={g.duct} material={m.duct} />
              {!lite &&
                Array.from({ length: 6 }, (_, k) => {
                  const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
                  return (
                    <mesh
                      key={k}
                      geometry={g.groove}
                      material={m.carbon}
                      position={[Math.cos(a) * (DUCT_OUT - 0.002), 0, Math.sin(a) * (DUCT_OUT - 0.002)]}
                      rotation={[0, -a, 0]}
                    />
                  );
                })}
              <mesh geometry={g.beam} material={m.carbon} />
              <mesh geometry={g.motor} material={m.motor} />
              <mesh geometry={g.bell} material={m.metal} position={[0, 0.045, 0]} />
              <mesh geometry={g.bell} material={m.metal} position={[0, -0.045, 0]} />
              {[0, 1].map((level) => (
                <group key={level} ref={(el) => void (rotors.current[i + level * 4] = el)} position={[0, level ? -0.05 : 0.05, 0]}>
                  {!lite && <mesh geometry={g.spinner} material={m.metal} position={[0, level ? -0.03 : 0.03, 0]} rotation={[level ? Math.PI : 0, 0, 0]} />}
                  {!lite &&
                    [0, 1, 2].map((b) => (
                      <mesh key={b} geometry={g.blade} material={m.blade} rotation={[level ? Math.PI : 0, (b * Math.PI * 2) / 3, 0]} />
                    ))}
                </group>
              ))}
              <mesh ref={(el) => void (discs.current[i] = el)} geometry={g.disc} material={discMats[i]} position={[0, 0.062, 0]} />
              <mesh geometry={g.disc} material={discMats[i]} position={[0, -0.062, 0]} />
              {/* Navigation lights on the forward pods: red to port (-Z), green to starboard (+Z). */}
              {x > 0 && <mesh geometry={g.light} material={side < 0 ? m.port : m.starboard} position={[0, 0, side * (DUCT_OUT + 0.012)]} />}
            </group>
          </group>
        );
      })}

      <mesh ref={strobe} geometry={g.light} material={m.strobe} position={[tail, bodyRadius(-0.9) + 0.01, 0]} scale={0.8} />
    </group>
  );
});

export default IndraKavach;
export { bodyRadius, POD_X, POD_Z };
