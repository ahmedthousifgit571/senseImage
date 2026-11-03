'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLenis } from 'lenis/react';
import { nav } from '@/content/site';
import { originOf, useMissionMode } from '@/components/providers/MissionMode';
import { flight } from '@/lib/flight';
import { gsap, REDUCED, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/util';

/** Quad ducted-fan glyph, after IndraKavach. */
function Mark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="6" y="10.4" width="12" height="3.2" rx="1.6" />
      <circle cx="6.5" cy="6.5" r="3.6" />
      <circle cx="17.5" cy="6.5" r="3.6" />
      <circle cx="6.5" cy="17.5" r="3.6" />
      <circle cx="17.5" cy="17.5" r="3.6" />
    </svg>
  );
}

/** Four dots that fold into a cross when the menu opens. */
function Dots({ open }: { open: boolean }) {
  return (
    <span aria-hidden className={cn('relative grid size-3 grid-cols-2 gap-[3px] transition-transform duration-500 ease-expo', open && 'rotate-45')}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="size-[4.5px] rounded-full bg-current" />
      ))}
    </span>
  );
}

/**
 * stillform-style chrome: wordmark left, mode toggle and MENU right. Its colour follows the section
 * underneath (sections declare data-chrome="horizon | sky | paper | graphite", and may change it while pinned).
 * A blend mode would do this for free, but Chrome drops the sticky hero's layer when it composites a
 * difference blend over the WebGL sky, so the tone is tracked instead.
 */
export default function Nav() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const first = useRef(true);
  const lenis = useLenis();
  const { mode, prime, toggle } = useMissionMode();
  const night = mode === 'night';

  const ranges = useRef<{ from: number; to: number; el: HTMLElement }[]>([]);
  const sync = useCallback((scroll: number) => {
    const header = root.current;
    if (!header) return;
    const probe = scroll + 40;
    const hit = ranges.current.find((r) => probe >= r.from && probe < r.to);
    // A thick cloud bank reads as paper, whatever lies under it.
    const tone = flight.washAmount > 0.4 ? 'paper' : (hit?.el.dataset.chrome ?? 'paper');
    if (header.dataset.on !== tone) header.dataset.on = tone;
  }, []);

  useLenis(({ scroll }) => sync(scroll));

  useGSAP(() => {
    const measure = () => {
      const y = window.scrollY;
      ranges.current = [...document.querySelectorAll<HTMLElement>('[data-chrome]')].map((el) => {
        // A pinned section owns its whole pin distance, which its spacer spans.
        const box = (el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el).getBoundingClientRect();
        return { from: box.top + y, to: box.bottom + y, el };
      });
      sync(y);
    };
    ScrollTrigger.addEventListener('refresh', measure);
    const frame = requestAnimationFrame(measure);
    // Pinned stages and the cloud bank change tone mid-scroll; poll lightly so the nav keeps up.
    const poll = window.setInterval(() => sync(window.scrollY), 150);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(poll);
      ScrollTrigger.removeEventListener('refresh', measure);
    };
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>('[data-menu-item]');
      if (first.current) {
        first.current = false;
        gsap.set(items, { yPercent: 110 });
        return;
      }
      const reduced = window.matchMedia(REDUCED).matches;
      if (open) {
        gsap.set('[data-menu]', { autoAlpha: 1 });
        gsap.fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: reduced ? 0.01 : 0.7, ease: 'mission', stagger: 0.045, overwrite: true });
      } else {
        gsap.to(items, {
          yPercent: -110,
          duration: reduced ? 0.01 : 0.35,
          ease: 'power2.in',
          stagger: 0.03,
          overwrite: true,
          onComplete: () => gsap.set('[data-menu]', { autoAlpha: 0 }),
        });
      }
    },
    { scope: root, dependencies: [open] },
  );

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    lenis?.scrollTo(href, { duration: 1.6 });
  };

  return (
    <header ref={root} data-on="horizon" className="site-nav pointer-events-none fixed inset-x-0 top-0 z-50 text-(--nav-fg) transition-colors duration-500">
      {/* Tighter spacing on phones so wordmark, mode switch and MENU fit a 360px screen. */}
      <div className="relative flex items-start justify-between gap-3 px-(--frame-x) pt-(--frame-y) sm:gap-6">
        <a
          href="#top"
          onClick={(e) => go(e, '#top')}
          aria-label="SenseImage Technologies, back to top"
          className="pointer-events-auto flex min-h-11 items-center gap-2.5 text-[15px] leading-none font-bold tracking-tight"
        >
          <Mark />
          <span className="whitespace-nowrap">
            SENSEIMAGE<span className="font-normal opacity-55 max-sm:hidden"> / IK</span>
          </span>
        </a>

        <div className="pointer-events-auto flex flex-col items-end">
          <div className="flex items-center gap-3.5 sm:gap-7">
            <button
              type="button"
              role="switch"
              aria-checked={night}
              aria-label="Night EO/IR mode"
              onPointerEnter={prime}
              onFocus={prime}
              onClick={(e) => toggle(originOf(e.currentTarget))}
              className="label flex min-h-11 items-center gap-2 text-[10px] sm:gap-2.5"
            >
              <span className={cn('transition-opacity duration-300 max-[359px]:sr-only', night ? 'opacity-60' : 'opacity-100')}>Day</span>
              <span className="relative block h-px w-5 bg-current/50 sm:w-7">
                <span className={cn('absolute top-1/2 size-[7px] -translate-y-1/2 rounded-full bg-current transition-[left] duration-500 ease-expo', night ? 'left-[calc(100%-7px)]' : 'left-0')} />
              </span>
              <span className={cn('transition-opacity duration-300 max-[359px]:sr-only', night ? 'opacity-100' : 'opacity-60')}>Night</span>
            </button>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((o) => !o)}
              className="flex min-h-11 items-center gap-2 text-[15px] leading-none font-bold tracking-tight"
            >
              MENU
              <Dots open={open} />
            </button>
          </div>

          <nav
            id="site-menu"
            aria-label="Primary"
            data-menu
            inert={!open}
            className="site-menu invisible -mr-5 mt-2 flex flex-col items-end rounded-2xl px-5 py-3.5 opacity-0 backdrop-blur-xl"
          >
            {nav.map((item) => (
              <a key={item.href} href={item.href} onClick={(e) => go(e, item.href)} className="roll-host block overflow-hidden py-0.5 text-[15px] leading-tight font-bold tracking-tight">
                <span data-menu-item className="block">
                  <span className="roll">
                    <span>{item.label.toUpperCase()}</span>
                    <span aria-hidden>{item.label.toUpperCase()}</span>
                  </span>
                </span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
