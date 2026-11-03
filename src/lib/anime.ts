'use client';

import { animate, type JSAnimation } from 'animejs';

const GLYPHS = '0123456789#%/<>=+';

const nf = new Intl.NumberFormat('en-IN');

/** Counts an element's text up to `to`, formatted with Indian digit grouping. */
export function countUp(el: HTMLElement, to: number, { duration = 1800, decimals = 0, delay = 0 } = {}) {
  const state = { v: 0 };
  const fmt = (v: number) => (decimals ? v.toFixed(decimals) : nf.format(Math.round(v)));
  el.textContent = fmt(0);
  return animate(state, {
    v: to,
    duration,
    delay,
    ease: 'outExpo',
    onUpdate: () => {
      el.textContent = fmt(state.v);
    },
    onComplete: () => {
      el.textContent = fmt(to);
    },
  });
}

/** Telemetry-style scramble: characters resolve left to right into `text`. */
export function scramble(el: HTMLElement, text: string, { duration = 700, chars = GLYPHS } = {}): JSAnimation {
  const state = { p: 0 };
  let tick = 0;
  return animate(state, {
    p: 1,
    duration,
    ease: 'linear',
    onUpdate: () => {
      tick++;
      const settled = Math.floor(state.p * text.length);
      let out = text.slice(0, settled);
      for (let i = settled; i < text.length; i++) {
        const c = text[i];
        out += c === ' ' || c === '/' || c === '.' ? c : chars[(i * 7 + tick * 3) % chars.length];
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = text;
    },
  });
}

/** Number that wanders around a centre, for decorative HUD readouts. */
export function wander(el: HTMLElement, centre: number, spread: number, { pad = 3, suffix = '' } = {}) {
  const state = { v: centre };
  const next = (): JSAnimation =>
    animate(state, {
      v: centre + (Math.random() * 2 - 1) * spread,
      duration: 1600 + Math.random() * 1400,
      ease: 'inOutSine',
      onUpdate: () => {
        el.textContent = String(Math.round(state.v)).padStart(pad, '0') + suffix;
      },
      onComplete: () => {
        current = next();
      },
    });
  let current = next();
  return () => current.pause();
}
