'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import IndraKavach, { type DroneFx } from './IndraKavach';

/** Effect levels, written by the flight rig each frame. */
export type EffectLevels = { nav: number; lock: number; speed: number; swarm: number; night: number; time: number };
type Levels = { readonly current: EffectLevels };

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const uniformsOf = (o: THREE.Object3D | null) => ((o as THREE.Mesh | null)?.material as THREE.ShaderMaterial | undefined)?.uniforms;

/** GPS-denied navigation: a level SLAM grid under the drone with a mapped point cloud. */
export function NavGrid({ levels }: { levels: Levels }) {
  const grid = useRef<THREE.Mesh>(null);
  const cloud = useRef<THREE.Points>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { uAmount: { value: 0 }, uTime: { value: 0 }, uNight: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vP;
          void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          varying vec2 vP;
          uniform float uAmount, uTime, uNight;
          float line(float v, float w) { float d = abs(fract(v - 0.5) - 0.5) / fwidth(v); return 1.0 - min(d / w, 1.0); }
          void main() {
            float r = length(vP);
            float minor = max(line(vP.x * 2.5, 1.0), line(vP.y * 2.5, 1.0)) * 0.35;
            float major = max(line(vP.x * 0.5, 1.4), line(vP.y * 0.5, 1.4));
            float ring = exp(-pow((r - mod(uTime * 1.6, 7.0)) * 3.0, 2.0));
            float fade = 1.0 - smoothstep(1.5, 6.0, r);
            float a = (minor + major * 0.8 + ring * 0.9) * fade * uAmount;
            vec3 col = mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 0.96, 0.83), uNight);
            gl_FragColor = vec4(col, a * 0.75);
          }`,
      }),
    [],
  );
  const points = useMemo(() => {
    const n = 520;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // Deterministic scatter: golden-angle spiral with jitter, clustered like mapped features.
      const a = i * 2.39996;
      const r = 0.6 + Math.sqrt(i / n) * 5.4;
      const j = Math.sin(i * 12.9898) * 43758.5453;
      const jitter = j - Math.floor(j);
      pos[i * 3] = Math.cos(a) * r + (jitter - 0.5) * 0.4;
      pos[i * 3 + 1] = Math.abs(Math.sin(i * 0.37)) * 0.35 * jitter;
      pos[i * 3 + 2] = Math.sin(a) * r + (jitter - 0.5) * 0.4;
      seed[i] = jitter;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uAmount: { value: 0 }, uTime: { value: 0 }, uNight: { value: 0 }, uScale: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime, uScale;
        varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float r = length(position.xz);
          float sweep = mod(uTime * 1.6, 7.0);
          vA = smoothstep(sweep + 0.2, sweep - 1.2, r) * 0.6 + 0.4 * (0.5 + 0.5 * sin(uTime * 3.0 + aSeed * 40.0));
          gl_PointSize = (2.0 + aSeed * 2.5) * uScale;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uAmount, uNight;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.1, d) * vA * uAmount;
          vec3 col = mix(vec3(1.0, 0.82, 0.3), vec3(0.0, 0.96, 0.83), uNight);
          gl_FragColor = vec4(col, a);
        }`,
    });
    return { g, m };
  }, []);

  useFrame((state) => {
    const lv = levels.current;
    const a = smooth(0, 1, lv.nav);
    for (const u of [uniformsOf(grid.current), uniformsOf(cloud.current)]) {
      if (!u) continue;
      u.uAmount.value = a;
      u.uTime.value = lv.time;
      u.uNight.value = lv.night;
    }
    const pu = uniformsOf(cloud.current);
    if (pu) pu.uScale.value = state.viewport.dpr;
    if (grid.current) grid.current.visible = a > 0.002;
    if (cloud.current) cloud.current.visible = a > 0.002;
  });

  return (
    <group position={[0, -1.15, 0]}>
      <mesh ref={grid} material={mat} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <planeGeometry args={[14, 14, 1, 1]} />
      </mesh>
      <points ref={cloud} geometry={points.g} material={points.m} />
    </group>
  );
}

const AMBER = new THREE.Color('#ffc21a');
const PHOSPHOR = new THREE.Color('#00f5d4');

/** AI targeting: a lock beam from the nose sensor to a reticle ahead. */
export function LockBeam({ levels }: { levels: Levels }) {
  const root = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const dot = useRef<THREE.Mesh>(null);
  const beamMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  );
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }), []);

  useFrame(() => {
    const lv = levels.current;
    const a = smooth(0, 1, lv.lock);
    if (root.current) root.current.visible = a > 0.002;
    const bm = beam.current?.material as THREE.MeshBasicMaterial | undefined;
    const rm = ring.current?.material as THREE.MeshBasicMaterial | undefined;
    if (bm) {
      bm.opacity = a * (0.55 + 0.25 * Math.sin(lv.time * 18));
      bm.color.copy(AMBER).lerp(PHOSPHOR, lv.night);
    }
    if (rm) {
      rm.opacity = a;
      rm.color.copy(AMBER).lerp(PHOSPHOR, lv.night);
    }
    if (beam.current) beam.current.scale.set(1, Math.max(0.001, a), 1);
    if (ring.current) {
      ring.current.rotation.x = lv.time * 1.4;
      ring.current.scale.setScalar(1 + 0.25 * (1 - a) + 0.06 * Math.sin(lv.time * 5));
    }
  });

  // Short enough that the reticle stays on screen in the close-up framing.
  const length = 1.15;
  return (
    <group ref={root} position={[1.08, -0.155, 0]}>
      <mesh ref={beam} material={beamMat} position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.007, 0.007, length, 8, 1, true]} />
      </mesh>
      <group position={[length, 0, 0]}>
        <mesh ref={ring} material={ringMat} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.2, 0.008, 8, 48]} />
        </mesh>
        <mesh ref={dot} material={ringMat}>
          <sphereGeometry args={[0.03, 12, 8]} />
        </mesh>
      </group>
    </group>
  );
}

/** Interception dash: air streaks flowing past the airframe, nose to tail. */
export function Streaks({ levels }: { levels: Levels }) {
  const lines = useRef<THREE.LineSegments>(null);
  const { geometry, material } = useMemo(() => {
    const n = 56;
    const pos = new Float32Array(n * 2 * 3);
    const seed = new Float32Array(n * 2);
    const end = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const h = Math.sin(i * 78.233) * 43758.5453;
      const s = h - Math.floor(h);
      const y = (Math.sin(i * 1.7) * 0.5 + (s - 0.5)) * 1.2;
      const z = (Math.cos(i * 2.3) * 0.6 + (s - 0.5) * 0.8) * 1.8;
      for (let k = 0; k < 2; k++) {
        pos.set([0, y, z], (i * 2 + k) * 3);
        seed[i * 2 + k] = s;
        end[i * 2 + k] = k;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uAmount: { value: 0 }, uNight: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aSeed, aEnd;
        uniform float uTime;
        varying float vFade;
        void main() {
          float span = 9.0;
          float head = mod(aSeed * 31.0 - uTime * (5.0 + aSeed * 6.0), span) - span * 0.5;
          float len = 0.6 + aSeed * 1.6;
          vec3 p = position;
          p.x = head + aEnd * len;
          vFade = (1.0 - aEnd) * (1.0 - smoothstep(2.6, 4.4, abs(head)));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uAmount, uNight;
        varying float vFade;
        void main() {
          vec3 col = mix(vec3(1.0), vec3(0.0, 0.96, 0.83), uNight);
          gl_FragColor = vec4(col, vFade * uAmount * 0.5);
        }`,
    });
    return { geometry: g, material: m };
  }, []);

  useFrame(() => {
    const lv = levels.current;
    const a = smooth(0, 1, lv.speed);
    const u = uniformsOf(lines.current);
    if (u) {
      u.uTime.value = lv.time;
      u.uAmount.value = a;
      u.uNight.value = lv.night;
    }
    if (lines.current) lines.current.visible = a > 0.002;
  });

  return <lineSegments ref={lines} geometry={geometry} material={material} frustumCulled={false} />;
}

// Wingmen sit behind and above the lead, in drone lengths.
const FORMATION: [number, number, number][] = [
  [-1.6, 0.35, -2.4],
  [-1.5, 0.2, 2.6],
  [-3.4, 0.75, -4.8],
  [-3.2, 0.6, 5.1],
  [-5.2, 1.2, -1.2],
  [-5.0, 1.0, 1.9],
];

/** Swarm intelligence: one operator, several interceptors in formation. Lives in the lead's body frame. */
export function Swarm({ levels, lead }: { levels: Levels; lead: { readonly current: DroneFx } }) {
  const members = useRef<(THREE.Group | null)[]>([]);
  const wing = useRef<DroneFx>({ rotor: 1, explode: 0, thermal: 0, scan: 0, time: 0 });

  useFrame(() => {
    const lv = levels.current;
    wing.current.rotor = lead.current.rotor;
    wing.current.time = lead.current.time;
    members.current.forEach((g, i) => {
      if (!g) return;
      const s = smooth(i * 0.09, i * 0.09 + 0.45, lv.swarm);
      g.visible = s > 0.01;
      if (!g.visible) return;
      const [x, y, z] = FORMATION[i];
      g.scale.setScalar(0.9 * s);
      const bob = Math.sin(lv.time * 1.3 + i * 1.7) * 0.06;
      // Wingmen slide in from far behind as the swarm forms up.
      g.position.set(x * 2.2 - (1 - s) * 4, y * 2.2 + bob, z * 0.9);
    });
  });

  return (
    <group>
      {FORMATION.map((_, i) => (
        <group key={i} ref={(el) => void (members.current[i] = el)} visible={false}>
          <IndraKavach fx={wing} lite />
        </group>
      ))}
    </group>
  );
}
