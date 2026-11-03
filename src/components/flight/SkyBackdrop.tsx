'use client';

import { useEffect, useRef } from 'react';
import { flight } from '@/lib/flight';

// Procedural sky behind the page: dawn above a sunlit cloud deck, a far ridgeline breaking through,
// cirrus overhead. Night mode grades it to an EO/IR phosphor image. One fullscreen triangle; it reads
// the drone layer's camera so both agree on the horizon. Shows through sections marked [data-sky].

const VERT = /* glsl */ `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uYaw, uPitch, uFocal, uNight;
uniform vec3 uSun;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = m * p; a *= 0.5; }
  return v;
}
float ridge(float x) {
  float h = 0.0, a = 0.55, f = 1.0;
  for (int i = 0; i < 5; i++) {
    float n = vnoise(vec2(x * f, 1.0 + float(i) * 7.31));
    h += a * (1.0 - abs(n * 2.0 - 1.0));
    f *= 2.07;
    a *= 0.47;
  }
  return h;
}
vec3 phosphor(float h) {
  h = clamp(h, 0.0, 1.0);
  vec3 c0 = vec3(0.008, 0.022, 0.03);
  vec3 c1 = vec3(0.016, 0.15, 0.15);
  vec3 c2 = vec3(0.035, 0.48, 0.43);
  vec3 c3 = vec3(0.30, 0.92, 0.81);
  vec3 c4 = vec3(0.92, 1.0, 0.98);
  if (h < 0.25) return mix(c0, c1, h / 0.25);
  if (h < 0.5) return mix(c1, c2, (h - 0.25) / 0.25);
  if (h < 0.75) return mix(c2, c3, (h - 0.5) / 0.25);
  return mix(c3, c4, (h - 0.75) / 0.25);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  vec3 rd = normalize(vec3(uv, -uFocal));
  float cp = cos(uPitch), sp = sin(uPitch);
  rd = vec3(rd.x, cp * rd.y - sp * rd.z, sp * rd.y + cp * rd.z);
  float cy = cos(uYaw), sy = sin(uYaw);
  rd = vec3(cy * rd.x + sy * rd.z, rd.y, -sy * rd.x + cy * rd.z);

  float h = rd.y;
  float sd = max(dot(rd, uSun), 0.0);
  float az = atan(rd.x, -rd.z);

  // Sky: warm haze on the horizon, deep cobalt overhead, a low sun to the left.
  vec3 zenith = vec3(0.035, 0.1, 0.24);
  vec3 upper = vec3(0.13, 0.29, 0.52);
  vec3 low = vec3(0.47, 0.58, 0.73);
  vec3 horizon = vec3(0.95, 0.81, 0.65);
  vec3 col = mix(horizon, low, smoothstep(0.0, 0.1, h));
  col = mix(col, upper, smoothstep(0.06, 0.34, h));
  col = mix(col, zenith, smoothstep(0.3, 0.95, h));
  col += vec3(1.0, 0.56, 0.28) * pow(sd, 5.0) * (1.0 - smoothstep(-0.05, 0.45, h)) * 0.45;
  col += vec3(1.0, 0.82, 0.58) * pow(sd, 48.0) * 0.55;
  col += vec3(1.0, 0.96, 0.88) * smoothstep(0.99935, 0.99965, sd) * 3.0;
  float heat = 0.05 + 0.13 * (1.0 - smoothstep(0.0, 0.6, h)) + pow(sd, 300.0) * 0.85;

  if (h > 0.0) {
    // Cirrus catching the sun.
    vec2 cp2 = rd.xz / (h + 0.06) * 0.6 + vec2(uTime * 0.004, 0.0);
    float ci = fbm(vec2(cp2.x * 0.35, cp2.y * 1.9) + 4.0);
    ci = smoothstep(0.52, 0.82, ci) * smoothstep(0.02, 0.18, h) * (1.0 - smoothstep(0.55, 0.9, h));
    col = mix(col, vec3(1.0, 0.87, 0.78) + vec3(0.18, 0.06, 0.0) * pow(sd, 3.0), ci * 0.5);
    heat += ci * 0.05;
    // Stars only register on the EO/IR sensor.
    vec2 sc = vec2(az, asin(clamp(h, -1.0, 1.0))) * 170.0;
    float s = hash12(floor(sc));
    float star = step(0.9962, s) * smoothstep(0.45, 0.0, length(fract(sc) - 0.5));
    heat += star * (0.45 + 0.25 * sin(uTime * 2.3 + s * 60.0)) * smoothstep(0.02, 0.2, h);
  } else {
    // Cloud deck below: a sunlit sea of billows, blue in the troughs, fading into haze at the horizon.
    float t = -1.0 / min(h, -0.002);
    vec2 p = rd.xz * t * 0.55 + vec2(uTime * 0.016, uTime * 0.005);
    float dens = fbm(p) * 0.7 + fbm(p * 2.7 + 3.7) * 0.4;
    vec2 ps = p + normalize(uSun.xz) * 0.07;
    float ds = fbm(ps) * 0.7 + fbm(ps * 2.7 + 3.7) * 0.4;
    float lit = clamp(0.5 + (dens - ds) * 4.2, 0.0, 1.0);
    float cover = smoothstep(0.34, 0.74, dens);
    vec3 cloud = mix(vec3(0.44, 0.52, 0.67), vec3(1.0, 0.91, 0.8), lit);
    cloud = mix(vec3(0.22, 0.29, 0.43), cloud, cover);
    cloud += vec3(1.0, 0.6, 0.32) * pow(sd, 3.0) * 0.3 * cover;
    float fog = 1.0 - exp(-t * 0.06);
    col = mix(cloud, mix(horizon, low, 0.3), fog);
    heat = mix(0.1 + 0.32 * cover * (0.5 + 0.5 * lit), 0.17, fog);
  }

  // A far ridgeline breaking through the deck, sunlit on the flank facing the sun.
  float mask = smoothstep(0.3, 0.72, vnoise(vec2(az * 1.1 + 3.0, 2.0)));
  float rh = (ridge(az * 3.4 + 11.0) - 0.42) * 0.11 * mask;
  float aa = 2.5 / (uRes.y * uFocal);
  if (h > -0.03 && h < rh + aa) {
    // Shade by a smoothed slope plus rock texture that varies with height, so faces don't streak into columns.
    float e = 0.03;
    float slope = (ridge((az + e) * 3.4 + 11.0) - ridge((az - e) * 3.4 + 11.0)) / (2.0 * e);
    float toward = sign(atan(uSun.x, -uSun.z) - az);
    float tex = fbm(vec2(az * 60.0, h * 140.0));
    float lit = clamp(0.48 + slope * toward * 0.05 + (tex - 0.5) * 0.5, 0.0, 1.0);
    float snow = smoothstep(rh - 0.035, rh - 0.006, h) * smoothstep(0.35, 0.6, tex + 0.2);
    vec3 rock = mix(vec3(0.36, 0.43, 0.57), vec3(0.98, 0.84, 0.7), lit);
    rock = mix(rock, vec3(1.0, 0.94, 0.88), snow * 0.6 * lit);
    vec3 m = mix(rock, horizon, 0.38 + 0.3 * smoothstep(0.02, -0.02, h));
    float cover = smoothstep(rh + aa, rh - aa, h) * smoothstep(-0.03, 0.01, h);
    col = mix(col, m, cover);
    heat = mix(heat, 0.26 + 0.24 * lit + snow * 0.05, cover);
  }

  vec3 night = phosphor(heat + (hash12(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.05);
  col = mix(col, night, uNight);
  col *= 1.0 - 0.16 * dot(uv * 0.5, uv * 0.5);
  col += (hash12(gl_FragCoord.xy * 1.7 + 3.1) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

const SUN: [number, number, number] = (() => {
  const v = [-0.55, 0.16, -0.82];
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
})();

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('[sky]', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

export default function SkyBackdrop() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const gl = el?.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    if (!el || !gl) return;
    const vs = shader(gl, gl.VERTEX_SHADER, VERT);
    const fs = shader(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const loc = { res: u('uRes'), time: u('uTime'), yaw: u('uYaw'), pitch: u('uPitch'), focal: u('uFocal'), night: u('uNight'), sun: u('uSun') };
    gl.uniform3fv(loc.sun, SUN);

    // The sky is soft, so it renders well below native resolution; quality adapts to the GPU.
    const small = window.matchMedia('(max-width: 47.99rem)').matches;
    const base = small ? 0.42 : 0.6;
    let scale = base;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.max(2, Math.round(window.innerWidth * dpr * scale));
      el.height = Math.max(2, Math.round(window.innerHeight * dpr * scale));
      gl.viewport(0, 0, el.width, el.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let skies: HTMLElement[] = [];
    const collect = () => (skies = [...document.querySelectorAll<HTMLElement>('[data-sky]')]);
    collect();
    const recollect = window.setInterval(collect, 1500);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    let night = document.documentElement.dataset.mode === 'night' ? 1 : 0;
    let raf = 0;
    let last = start;
    let slow = 0;
    let fast = 0;
    let drawn = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (document.hidden) return;
      const vh = window.innerHeight;
      const onScreen = skies.some((s) => {
        const r = s.getBoundingClientRect();
        return r.bottom > 0 && r.top < vh && r.height > 0;
      });
      if (!onScreen && drawn) return;

      const target = document.documentElement.dataset.mode === 'night' ? 1 : 0;
      night += (target - night) * (1 - Math.exp(-dt * 12));
      const time = reduced ? 8 : (now - start) / 1000;
      gl.uniform2f(loc.res, el.width, el.height);
      gl.uniform1f(loc.time, time);
      gl.uniform1f(loc.yaw, flight.cam.yaw);
      gl.uniform1f(loc.pitch, flight.cam.pitch);
      gl.uniform1f(loc.focal, 1 / Math.tan(((flight.cam.fov / 2) * Math.PI) / 180));
      gl.uniform1f(loc.night, night);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      drawn = true;

      // Drop resolution on slow GPUs, recover on fast ones.
      if (dt > 0.024) slow++;
      else slow = Math.max(0, slow - 1);
      if (dt < 0.0125) fast++;
      else fast = 0;
      if (slow > 40 && scale > 0.3) {
        scale = Math.max(0.3, scale * 0.8);
        slow = 0;
        resize();
      } else if (fast > 240 && scale < base) {
        scale = Math.min(base, scale * 1.15);
        fast = 0;
        resize();
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(recollect);
      window.removeEventListener('resize', resize);
      // Free GPU objects but keep the context: StrictMode remounts into this same canvas.
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <div aria-hidden className="sky-backdrop pointer-events-none fixed inset-0 -z-10">
      <canvas ref={canvas} className="block size-full" />
    </div>
  );
}
