// Shared flight state. Page sections declare "bays" (empty grid areas reserved for the drone);
// the WebGL layer reads them every frame and flies the IndraKavach between them.
// Plain mutable objects on purpose: they are read inside render loops, not React renders.

export type Pose = {
  /** Where the drone sits inside its bay, 0..1 on each axis. */
  x: number;
  y: number;
  /** Drone span as a share of the bay (1 = touches the bay's limiting edge). */
  fill: number;
  /** Attitude in radians: heading, nose up, right side down. */
  yaw: number;
  pitch: number;
  roll: number;
  /** Shared camera, so the sky backdrop and the drone agree on where "down" is. */
  camYaw: number;
  camPitch: number;
  /** 0 parked, 1 hover, 2 full climb. */
  rotor: number;
  explode: number;
  /** 0 optical, 1 EO/IR thermal. Night mode forces 1. */
  thermal: number;
  swarm: number;
  /** GPS-denied navigation overlay: SLAM grid and point cloud. */
  nav: number;
  /** Target lock beam from the nose sensor. */
  lock: number;
  /** Interception dash: speed streaks. */
  speed: number;
};

export const POSE_KEYS = [
  'x',
  'y',
  'fill',
  'yaw',
  'pitch',
  'roll',
  'camYaw',
  'camPitch',
  'rotor',
  'explode',
  'thermal',
  'swarm',
  'nav',
  'lock',
  'speed',
] as const satisfies readonly (keyof Pose)[];

export const DEFAULT_POSE: Pose = {
  x: 0.5,
  y: 0.5,
  fill: 0.8,
  yaw: -2.45,
  pitch: 0.04,
  roll: 0,
  camYaw: 0,
  camPitch: -0.2,
  rotor: 1,
  explode: 0,
  thermal: 0,
  swarm: 0,
  nav: 0,
  lock: 0,
  speed: 0,
};

export type Bay = {
  id: string;
  el: HTMLElement;
  pose: Pose;
  /** Sections fade a bay out while another layer covers it (sticky hero, pinned stages). */
  gain: number;
  /** Clip the drone to the bay's rectangle, for windows cut into a page. */
  clip: boolean;
};

export const flight = {
  bays: new Map<string, Bay>(),
  /** Written by the drone layer, read by the sky backdrop. */
  cam: { yaw: 0, pitch: -0.2, fov: 36 },
  pointer: { x: 0, y: 0 },
  /** Elements whose top edge rolls a cloud bank over the page as it scrolls in. */
  washes: new Set<HTMLElement>(),
  /** How much of the screen the cloud bank currently covers, 0..1; the nav darkens over it. */
  washAmount: 0,
  /** Set once the drone layer has drawn real frames. */
  ready: false,
};

export const FLIGHT_READY = 'si:flight-ready';

export function registerBay(id: string, el: HTMLElement, pose: Partial<Pose>, clip = false) {
  flight.bays.set(id, { id, el, pose: { ...DEFAULT_POSE, ...pose }, gain: 1, clip });
}

export function unregisterBay(id: string, el: HTMLElement) {
  if (flight.bays.get(id)?.el === el) flight.bays.delete(id);
}

/** Updates part of a bay's pose; GSAP timelines call this from onUpdate. */
export function setPose(id: string, patch: Partial<Pose>) {
  const bay = flight.bays.get(id);
  if (bay) Object.assign(bay.pose, patch);
}

export function setGain(id: string, gain: number) {
  const bay = flight.bays.get(id);
  if (bay) bay.gain = Math.min(1, Math.max(0, gain));
}

export function registerWash(el: HTMLElement) {
  flight.washes.add(el);
  return () => void flight.washes.delete(el);
}

export function lerpPose(a: Pose, b: Pose, t: number, out: Partial<Pose> = {}) {
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out as Pose;
}

export const markFlightReady = () => {
  if (flight.ready) return;
  flight.ready = true;
  document.documentElement.dataset.flight = 'on';
  window.dispatchEvent(new Event(FLIGHT_READY));
};
