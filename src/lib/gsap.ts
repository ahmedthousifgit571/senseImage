'use client';

import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase, SplitText);

CustomEase.create('mission', '0.16, 1, 0.3, 1');
CustomEase.create('missionInOut', '0.76, 0, 0.24, 1');

ScrollTrigger.config({ ignoreMobileResize: true });

export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
export const REDUCED = '(prefers-reduced-motion: reduce)';
export const FINE_POINTER = '(hover: hover) and (pointer: fine)';
export const DESKTOP = '(min-width: 64rem)';

// Touch screens have no hover, so a card shows its hover look while it crosses the middle of the screen.
export function liveWhileCentred(targets: Element[]) {
  return targets.map((trigger) => ScrollTrigger.create({ trigger, start: 'top 60%', end: 'bottom 40%', toggleClass: 'is-live' }));
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
