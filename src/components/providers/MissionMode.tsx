'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { gsap, REDUCED } from '@/lib/gsap';
import { scramble } from '@/lib/anime';

export type Mode = 'day' | 'night';
type Origin = { x: number; y: number };

type MissionMode = {
  mode: Mode;
  /** Night images mount once someone shows interest in the switch, so the first swap is instant. */
  nightReady: boolean;
  prime: () => void;
  switchTo: (next: Mode, origin?: Origin) => void;
  toggle: (origin?: Origin) => void;
};

const MissionModeContext = createContext<MissionMode | null>(null);

export function useMissionMode() {
  const ctx = useContext(MissionModeContext);
  if (!ctx) throw new Error('useMissionMode must be used inside <MissionModeProvider>');
  return ctx;
}

const COPY: Record<Mode, { title: string; line: string }> = {
  night: { title: 'By night', line: 'EO/IR sensor online // thermal calibrated' },
  day: { title: 'By day', line: 'Optical recon // sun-lit airspace' },
};

export function originOf(el: Element | null): Origin | undefined {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export default function MissionModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('day');
  const [nightReady, setNightReady] = useState(false);
  const busy = useRef(false);
  const modeRef = useRef<Mode>('day');
  const overlay = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLParagraphElement>(null);
  const line = useRef<HTMLParagraphElement>(null);
  const live = useRef<HTMLParagraphElement>(null);

  const prime = useCallback(() => setNightReady(true), []);

  const switchTo = useCallback((next: Mode, origin?: Origin) => {
    if (busy.current || next === modeRef.current || !overlay.current) return;
    busy.current = true;
    setNightReady(true);

    const el = overlay.current;
    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;
    const reduced = window.matchMedia(REDUCED).matches;
    el.dataset.target = next;
    if (title.current) title.current.textContent = COPY[next].title;
    if (line.current) line.current.textContent = '';

    const commit = () => {
      document.documentElement.dataset.mode = next;
      modeRef.current = next;
      setMode(next);
      if (live.current) live.current.textContent = next === 'night' ? 'Night EO/IR mode on' : 'Day optical mode on';
    };
    const done = () => {
      gsap.set(el, { autoAlpha: 0, clipPath: 'none' });
      busy.current = false;
    };

    if (reduced) {
      gsap.timeline({ onComplete: done })
        .fromTo(el, { autoAlpha: 0, clipPath: 'none' }, { autoAlpha: 1, duration: 0.15 })
        .add(commit)
        .to(el, { autoAlpha: 0, duration: 0.2, delay: 0.1 });
      return;
    }

    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 40;
    gsap.timeline({ onComplete: done })
      .set(el, { autoAlpha: 1, clipPath: `circle(0px at ${x}px ${y}px)` })
      .to(el, { clipPath: `circle(${radius}px at ${x}px ${y}px)`, duration: 0.7, ease: 'missionInOut' })
      .add(() => line.current && scramble(line.current, COPY[next].line.toUpperCase(), { duration: 650 }), 0.15)
      .fromTo(el.querySelector('[data-overlay-copy]'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'mission' }, 0.25)
      .add(commit)
      .to(el, { autoAlpha: 0, duration: 0.55, ease: 'power2.inOut' }, '+=0.45');
  }, []);

  const toggle = useCallback((origin?: Origin) => switchTo(modeRef.current === 'day' ? 'night' : 'day', origin), [switchTo]);

  const value = useMemo(() => ({ mode, nightReady, prime, switchTo, toggle }), [mode, nightReady, prime, switchTo, toggle]);

  return (
    <MissionModeContext.Provider value={value}>
      {children}
      <div
        ref={overlay}
        aria-hidden
        className="pointer-events-none invisible fixed inset-0 z-[100] grid place-items-center opacity-0 data-[target=day]:bg-[linear-gradient(180deg,#0b3b75_0%,#1e5799_55%,#b9cadb_100%)] data-[target=night]:bg-[radial-gradient(120%_90%_at_50%_45%,#081221_0%,#040811_70%)]"
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgb(0_245_212/0.07)_0_1px,transparent_1px_3px)] opacity-0 [[data-target=night]_&]:opacity-100" />
        <div data-overlay-copy className="relative text-center text-white [[data-target=night]_&]:text-phosphor">
          <p ref={title} className="display text-[clamp(56px,11vw,180px)]" />
          <p ref={line} className="telemetry mt-6 min-h-[1.4em] text-[11px] opacity-80 sm:text-[12px]" />
        </div>
      </div>
      <p ref={live} aria-live="polite" className="sr-only" />
    </MissionModeContext.Provider>
  );
}
