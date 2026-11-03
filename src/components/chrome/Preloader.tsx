'use client';

import { useEffect, useRef } from 'react';
import { useLenis } from 'lenis/react';
import { flight, FLIGHT_READY } from '@/lib/flight';
import { gsap, REDUCED, useGSAP } from '@/lib/gsap';
import { markIntroDone } from '@/lib/util';

/** stillform-style curtain: wordmark left, live percentage right, a hairline filling underneath. */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const lenis = useLenis();
  // Lenis is created after this component's first effects run, so read it through a ref when the curtain lifts.
  const lenisRef = useRef(lenis);

  useEffect(() => {
    lenisRef.current = lenis;
    if (!lenis) return;
    if (finished.current) lenis.start();
    else {
      // Lenis keeps its own target, so reset it too or it glides back to wherever the browser left off.
      lenis.scrollTo(0, { immediate: true, force: true });
      lenis.stop();
    }
  }, [lenis]);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);

      const finish = () => {
        if (finished.current) return;
        finished.current = true;
        lenisRef.current?.start();
        markIntroDone();
      };

      if (window.matchMedia(REDUCED).matches) {
        gsap.set(el, { autoAlpha: 0 });
        finish();
        return;
      }

      const count = el.querySelector<HTMLElement>('[data-count]');
      const bar = el.querySelector<HTMLElement>('[data-bar]');
      let fonts = false;
      let flying = flight.ready;
      document.fonts?.ready.then(() => (fonts = true));
      const onReady = () => (flying = true);
      window.addEventListener(FLIGHT_READY, onReady);

      const start = performance.now();
      let shown = 0;
      let leaving = false;
      const tick = () => {
        const t = (performance.now() - start) / 1000;
        // Real readiness drives the last stretch; a cap keeps a slow GPU from holding the page hostage.
        const ready = (fonts && flying) || t > 6;
        const cap = ready ? 100 : Math.min(88, 18 + t * 34);
        shown += (cap - shown) * (ready ? 0.12 : 0.06);
        const v = Math.min(100, Math.round(shown));
        if (count) count.textContent = String(v);
        if (bar) bar.style.transform = `scaleX(${shown / 100})`;
        if (!leaving && ready && shown > 99.4 && t > 1.1) {
          leaving = true;
          if (count) count.textContent = '100';
          gsap.ticker.remove(tick);
          gsap
            .timeline()
            .to('[data-pre-row]', { yPercent: -120, duration: 0.6, ease: 'power3.in', stagger: 0.05 })
            .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'missionInOut' }, '-=0.2')
            .add(finish, '-=0.55')
            .set(el, { autoAlpha: 0 });
        }
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener(FLIGHT_READY, onReady);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden className="preloader fixed inset-0 z-[110] grid place-items-center bg-[#15171a] px-(--frame-x) text-[#efece6] [clip-path:inset(0)]">
      <div className="w-full">
        <div className="flex items-end justify-between gap-6 overflow-hidden">
          <p data-pre-row className="text-[clamp(22px,2.4vw,34px)] leading-none font-bold tracking-tight">
            SENSEIMAGE<span className="font-normal opacity-50"> / IK</span>
          </p>
          <p data-pre-row className="text-[clamp(22px,2.4vw,34px)] leading-none font-semibold tabular-nums">
            <span data-count>0</span>
          </p>
        </div>
        <span className="mt-4 block h-px w-full bg-white/15">
          <span data-bar className="block h-full origin-left scale-x-0 bg-[#efece6]" />
        </span>
        <div className="mt-3 flex justify-between overflow-hidden text-[10px] font-semibold tracking-[0.22em] text-white/45 uppercase">
          <span data-pre-row>Systems check</span>
          <span data-pre-row>12.8230° N · 80.2294° E</span>
        </div>
      </div>
    </div>
  );
}
