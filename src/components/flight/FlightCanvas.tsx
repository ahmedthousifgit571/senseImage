'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei/core/Environment';
import { Lightformer } from '@react-three/drei/core/Lightformer';
import { DEFAULT_POSE, flight, markFlightReady, POSE_KEYS, type Bay, type Pose } from '@/lib/flight';
import { LockBeam, NavGrid, Streaks, Swarm, type EffectLevels } from './Effects';
import IndraKavach, { LENGTH, type DroneFx } from './IndraKavach';

const FOV = 36;
const CAM_Z = 12;
/** World units visible top to bottom at the drone's plane. */
const VIEW_H = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180);

/** Where the drone waits when no bay is on screen: up and out of frame, climbing. */
const AWAY: Pose = { ...DEFAULT_POSE, yaw: -0.5, pitch: 0.28, roll: -0.25, rotor: 1.7 };
const AWAY_LEFT: Pose = { ...AWAY, yaw: -2.6, roll: 0.25 };

const SUN = new THREE.Vector3(-0.78, 0.2, -0.6).normalize();
const SUN_POS: [number, number, number] = [SUN.x * 10, SUN.y * 10 + 4, SUN.z * 10 + 6];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const damp = (dt: number, rate: number) => 1 - Math.exp(-dt * rate);
const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

type Candidate = { bay: Bay; rect: DOMRect; f: number };

/** Cloud bank that rolls over the page at the top edge of a "wash" section. */
function createWash() {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uEdge: { value: 2 },
      uAmount: { value: 0 },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uColor: { value: hex('#eae7e0') },
      uShade: { value: hex('#c3ccd6') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uEdge, uAmount, uTime, uAspect;
      uniform vec3 uColor, uShade;
      float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; } return v; }
      void main() {
        float y = 1.0 - vUv.y;
        vec2 p = vec2(vUv.x * uAspect, y);
        float n = fbm(p * 2.3 + vec2(uTime * 0.035, uTime * 0.012));
        float n2 = fbm(p * 5.6 - vec2(uTime * 0.05, -uTime * 0.01));
        float billow = (n - 0.5) * 0.6 + (n2 - 0.5) * 0.2;
        // Solid under the edge, breaking into billows and haze ahead of it.
        float d = y - uEdge;
        float body = smoothstep(-0.5, 0.05, d + billow);
        float haze = smoothstep(-0.65, -0.05, d + billow * 0.5) * 0.28;
        float a = clamp(max(body, haze), 0.0, 1.0) * uAmount;
        float light = clamp(smoothstep(0.3, 0.8, n) * 0.55 + smoothstep(-0.25, 0.2, d) * 0.45, 0.0, 1.0);
        gl_FragColor = vec4(mix(uShade, uColor, light), a);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), material, amount: 0 };
}

const WASH_COLORS = {
  day: {
    paper: { color: hex('#eae7e0'), shade: hex('#c3ccd6') },
    wash: { color: hex('#f5f3ef'), shade: hex('#cdd5de') },
  },
  night: {
    paper: { color: hex('#05090e'), shade: hex('#0d2b2e') },
    wash: { color: hex('#071018'), shade: hex('#0f2e32') },
  },
};

function createSim() {
  return {
    started: false,
    frames: 0,
    x: 0,
    y: 0,
    s: 0,
    vx: 0,
    vy: 0,
    vs: 0,
    pose: { ...AWAY } as Pose,
    target: { ...AWAY } as Pose,
    camYaw: DEFAULT_POSE.camYaw,
    camPitch: DEFAULT_POSE.camPitch,
    px: 0,
    py: 0,
    clip: null as null | { x: number; y: number; w: number; h: number },
    visible: false,
    side: 1,
  };
}

function Rig() {
  const lights = useRef<THREE.Group>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const sunTarget = useRef<THREE.Object3D>(null);
  const dock = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const orient = useRef<THREE.Group>(null);
  const attitude = useRef<THREE.Group>(null);
  // Flight state changes every frame, outside React's render, so it lives in refs.
  const drone = useRef<DroneFx>({ rotor: 1, explode: 0, thermal: 0, scan: 0, time: 0 });
  const levels = useRef<EffectLevels>({ nav: 0, lock: 0, speed: 0, swarm: 0, night: 0, time: 0 });
  const simRef = useRef<ReturnType<typeof createSim> | null>(null);
  const washRef = useRef<ReturnType<typeof createWash> | null>(null);
  const reduced = useRef(false);
  const mouse = useRef(false);

  useEffect(() => {
    if (sun.current && sunTarget.current) sun.current.target = sunTarget.current;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
    const onMq = () => (reduced.current = mq.matches);
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mouse.current = true;
      flight.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      flight.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    mq.addEventListener('change', onMq);
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      mq.removeEventListener('change', onMq);
      window.removeEventListener('pointermove', move);
    };
  }, []);

  useFrame((state, delta) => {
    const sim = (simRef.current ??= createSim());
    const wash = (washRef.current ??= createWash());
    const fx = drone.current;
    const lv = levels.current;
    const dt = Math.min(delta, 1 / 20);
    const time = state.clock.elapsedTime;
    const vw = state.size.width;
    const vh = state.size.height;

    // ---- 1. Which bays are on screen, and how much. ----
    const bandTop = vh * 0.06;
    const bandBot = vh * 0.94;
    const bandH = bandBot - bandTop;
    let a: Candidate | null = null;
    let b: Candidate | null = null;
    for (const bay of flight.bays.values()) {
      if (bay.gain <= 0.001) continue;
      const rect = bay.el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;
      const oy = Math.max(0, Math.min(rect.bottom, bandBot) - Math.max(rect.top, bandTop)) / Math.min(rect.height, bandH);
      const ox = Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0)) / Math.min(rect.width, vw);
      const f = smooth(0.04, 0.8, oy) * smooth(0.25, 0.85, ox) * bay.gain;
      if (f <= 0.001) continue;
      const c = { bay, rect, f };
      if (!a || f > a.f) {
        b = a;
        a = c;
      } else if (!b || f > b.f) b = c;
    }

    let wa = a?.f ?? 0;
    let wb = b?.f ?? 0;
    if (wa + wb > 1) {
      const s = wa + wb;
      wa /= s;
      wb /= s;
    }
    const wAway = Math.max(0, 1 - wa - wb);

    // ---- 2. Blend their placements and poses. ----
    const target = sim.target;
    for (const k of POSE_KEYS) target[k] = 0;
    let tx = 0;
    let ty = 0;
    let ts = 0;
    const add = (w: number, cx: number, cy: number, span: number, pose: Pose) => {
      if (w <= 0) return;
      tx += w * cx;
      ty += w * cy;
      ts += w * span;
      for (const k of POSE_KEYS) target[k] += w * pose[k];
    };
    const place = (c: Candidate, w: number) => {
      const { rect, bay } = c;
      const p = bay.pose;
      add(w, rect.left + p.x * rect.width, rect.top + p.y * rect.height, Math.min(rect.width, rect.height * 2) * p.fill, p);
    };
    if (a) place(a, wa);
    if (b) place(b, wb);
    // Leave, and come back, on the side the drone was last seen, so it never cuts back across the page.
    if (wa + wb > 0.6) sim.side = sim.x >= vw * 0.5 ? 1 : -1;
    add(wAway, sim.side > 0 ? vw * 1.02 : -vw * 0.02, -vh * 0.45, Math.min(vw, vh) * 0.2, sim.side > 0 ? AWAY : AWAY_LEFT);

    // The camera only follows real bays, so the sky never swings while the drone is away.
    if (wa + wb > 0.001 && a) {
      const pa = a.bay.pose;
      const pb = b?.bay.pose ?? pa;
      const n = wa + wb;
      sim.camYaw += ((pa.camYaw * wa + pb.camYaw * wb) / n - sim.camYaw) * damp(dt, 3.2);
      sim.camPitch += ((pa.camPitch * wa + pb.camPitch * wb) / n - sim.camPitch) * damp(dt, 3.2);
    }

    // A clipped bay (a window cut into the page) closes the frame around the drone as it takes over.
    sim.clip = null;
    const clipper = a?.bay.clip ? a : b?.bay.clip ? b : null;
    if (clipper) {
      const k = smooth(0.2, 0.75, clipper === a ? wa : wb);
      const r = clipper.rect;
      const x0 = Math.max(0, r.left);
      const y0 = Math.max(0, r.top);
      const x1 = Math.min(vw, r.right);
      const y1 = Math.min(vh, r.bottom);
      sim.clip = { x: x0 * k, y: y0 * k, w: vw + (x1 - x0 - vw) * k, h: vh + (y1 - y0 - vh) * k };
    }

    // ---- 3. Fly there. ----
    if (!sim.started) {
      sim.x = tx;
      sim.y = ty;
      sim.s = ts;
      Object.assign(sim.pose, target);
      sim.started = true;
    } else if (reduced.current) {
      sim.x = tx;
      sim.y = ty;
      sim.s = ts;
      sim.vx = sim.vy = 0;
      Object.assign(sim.pose, target);
    } else {
      const K = 46;
      const D = 2 * Math.sqrt(K) * 0.86;
      sim.vx += ((tx - sim.x) * K - sim.vx * D) * dt;
      sim.vy += ((ty - sim.y) * K - sim.vy * D) * dt;
      sim.vs += ((ts - sim.s) * K - sim.vs * D) * dt;
      sim.x += sim.vx * dt;
      sim.y += sim.vy * dt;
      sim.s += sim.vs * dt;
      const k = damp(dt, 3.6);
      for (const key of POSE_KEYS) sim.pose[key] += (target[key] - sim.pose[key]) * k;
    }

    const pose = sim.pose;
    const motion = reduced.current ? 0 : 1;
    // Touch screens have no cursor to look after, so the drone and camera drift on their own, slowly.
    if (!mouse.current) {
      flight.pointer.x = Math.sin(time * 0.23) * 0.6;
      flight.pointer.y = Math.sin(time * 0.17 + 1.3) * 0.4;
    }
    sim.px += (flight.pointer.x - sim.px) * damp(dt, 2.6);
    sim.py += (flight.pointer.y - sim.py) * damp(dt, 2.6);

    // Shared camera: the sky backdrop reads this.
    flight.cam.yaw = sim.camYaw + sim.px * 0.045 * motion;
    flight.cam.pitch = sim.camPitch - sim.py * 0.03 * motion;
    flight.cam.fov = FOV;

    // ---- 4. Apply. ----
    const span = Math.max(1, sim.s);
    const px2w = VIEW_H / vh;
    const bob = Math.sin(time * 1.25) * span * 0.012 * motion;
    const visible = sim.y > -span && sim.y < vh + span && sim.x > -span && sim.x < vw + span && span > 6;
    sim.visible = visible;

    if (dock.current) {
      dock.current.visible = visible;
      dock.current.position.set((sim.x - vw / 2) * px2w, -(sim.y + bob - vh / 2) * px2w, 0);
      dock.current.scale.setScalar((span * px2w) / LENGTH);
    }
    if (tilt.current) {
      // Lean into the motion, like a multirotor tilting its thrust.
      tilt.current.rotation.z = clamp((-sim.vx / vw) * 0.5, -0.45, 0.45) * motion;
      tilt.current.rotation.x = clamp((sim.vy / vh) * 0.3, -0.3, 0.3) * motion;
    }
    if (orient.current) orient.current.rotation.set(-flight.cam.pitch, -flight.cam.yaw, 0, 'XYZ');
    if (lights.current) lights.current.rotation.set(-flight.cam.pitch, -flight.cam.yaw, 0, 'XYZ');
    if (attitude.current) {
      const heading = clamp((sim.vx / vw) * 0.55, -0.4, 0.4) * motion;
      attitude.current.rotation.set(
        pose.roll + Math.sin(time * 0.9) * 0.022 * motion,
        pose.yaw + heading + sim.px * 0.12 * motion,
        pose.pitch + Math.sin(time * 1.1 + 1) * 0.018 * motion - sim.py * 0.05 * motion,
        'YZX',
      );
    }
    state.scene.environmentRotation.set(-flight.cam.pitch, -flight.cam.yaw, 0, 'XYZ');

    const night = document.documentElement.dataset.mode === 'night' ? 1 : 0;
    const speed = Math.min(1, Math.hypot(sim.vx, sim.vy) / Math.max(vw, vh));
    fx.time = time;
    fx.rotor = pose.rotor + speed * 0.8;
    fx.explode = pose.explode;
    fx.thermal = night;
    fx.scan = pose.thermal;
    lv.nav = pose.nav;
    lv.lock = pose.lock;
    lv.speed = pose.speed;
    lv.swarm = pose.swarm;
    lv.night = night;
    lv.time = time;

    // ---- 5. Cloud wash at the leading edge of a wash section. ----
    let edge = 2;
    let tone: 'paper' | 'wash' = 'paper';
    for (const el of flight.washes) {
      const top = el.getBoundingClientRect().top / vh;
      if (top > -0.4 && top < 1.6) {
        edge = top;
        tone = el.dataset.tone === 'wash' ? 'wash' : 'paper';
        break;
      }
    }
    // Nothing while the section waits below the fold; the bank builds as its edge climbs, then clears at the top.
    const amount = smooth(1.0, 0.72, edge) * smooth(-0.02, 0.3, edge);
    wash.amount = amount;
    // Coverage at the top of the screen, where the nav sits.
    flight.washAmount = amount * smooth(0.75, 0.3, edge);
    const u = wash.material.uniforms;
    u.uEdge.value = edge;
    u.uAmount.value = amount;
    u.uTime.value = time;
    u.uAspect.value = vw / vh;
    const palette = (night ? WASH_COLORS.night : WASH_COLORS.day)[tone];
    (u.uColor.value as THREE.Vector3).copy(palette.color);
    (u.uShade.value as THREE.Vector3).copy(palette.shade);
  });

  // Manual render: clear, scissor to a window bay if needed, draw the drone, then the cloud wash.
  useFrame(({ gl, scene, camera, size }) => {
    const sim = simRef.current;
    const wash = washRef.current;
    if (!sim || !wash) return;
    gl.autoClear = false;
    gl.setScissorTest(false);
    gl.clear(true, true, true);
    if (sim.visible) {
      const c = sim.clip;
      if (c) {
        gl.setScissorTest(true);
        gl.setScissor(c.x, size.height - c.y - c.h, c.w, c.h);
      }
      gl.render(scene, camera);
      gl.setScissorTest(false);
    }
    if (wash.amount > 0.002) gl.render(wash.scene, wash.camera);
    if (++sim.frames === 4) markFlightReady();
  }, 1);

  return (
    <>
      {/* Lights turn with the camera orbit but never move with the drone, so their direction stays true. */}
      <group ref={lights}>
        <directionalLight ref={sun} position={SUN_POS} intensity={2.4} color="#ffe2c4" />
        <object3D ref={sunTarget} />
        {/* Bounce off the sunlit cloud deck below. */}
        <hemisphereLight args={['#bcd3f0', '#f3e6d6', 0.9]} />
      </group>
      <group ref={dock}>
        <group ref={tilt}>
          <group ref={orient}>
            <NavGrid levels={levels} />
            <group ref={attitude}>
              <IndraKavach fx={drone} primary />
              <LockBeam levels={levels} />
              <Streaks levels={levels} />
              <Swarm levels={levels} lead={drone} />
            </group>
          </group>
        </group>
      </group>
    </>
  );
}

export default function FlightCanvas() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
        camera={{ fov: FOV, near: 0.1, far: 200, position: [0, 0, CAM_Z] }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
        style={{ pointerEvents: 'none' }}
      >
        <Environment frames={1} resolution={256}>
          <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
          <Lightformer form="rect" intensity={3.4} color="#ffd6ab" position={[-9, 2, -5]} rotation-y={Math.PI / 3} scale={[7, 3, 1]} />
          <Lightformer form="rect" intensity={1.3} color="#c4d8ff" position={[9, 2, 3]} rotation-y={-Math.PI / 2.4} scale={[7, 4, 1]} />
          <Lightformer form="rect" intensity={1.5} color="#f1ebe2" position={[0, -7, 0]} rotation-x={-Math.PI / 2} scale={[16, 16, 1]} />
          <Lightformer form="ring" intensity={2.4} color="#ffffff" position={[3, 3, 9]} scale={2.4} />
        </Environment>
        <Rig />
      </Canvas>
    </div>
  );
}
