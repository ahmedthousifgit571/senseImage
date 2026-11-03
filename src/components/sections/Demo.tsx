'use client';

import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { demo } from '@/content/site';
import DroneBay from '@/components/flight/DroneBay';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';

const DEMO_POSE = { x: 0.52, y: 0.52, fill: 0.78, yaw: -2.05, pitch: 0.02, roll: -0.04, camYaw: -0.3, camPitch: -0.1, rotor: 1.2 };

/** stillform's "Step inside.", as an invitation to watch IndraKavach fly. */
export default function Demo() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from('[data-demo-line]', { yPercent: 110, duration: 1.3, ease: 'mission', scrollTrigger: { trigger: root.current, start: 'top 45%' } });
        gsap.from('[data-demo-fade]', { autoAlpha: 0, y: 30, duration: 1, ease: 'mission', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 40%' } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="demo" data-sky data-chrome="sky" aria-labelledby="demo-title" className="tone-sky relative z-20 overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(5_10_20/0.35),transparent_26%,transparent_55%,rgb(5_10_20/0.6))]" />
      <div aria-hidden className="scanlines absolute inset-0" />
      <div className="relative grid min-h-svh grid-rows-[auto_minmax(32svh,1fr)_auto] gap-y-4 px-(--frame-x) pt-[calc(var(--frame-y)+72px)] pb-[calc(var(--frame-y)+env(safe-area-inset-bottom))]">
        <div data-demo-fade className="flex flex-wrap items-start justify-between gap-4">
          <p className="eyebrow text-white/80">{demo.eyebrow}</p>
          <ul aria-hidden className="telemetry flex gap-2 text-[10px]">
            <li className="rounded-full border border-white/30 px-3 py-1.5">IK-01</li>
            <li className="rounded-full border border-white/30 px-3 py-1.5">
              Link <span className="text-signal">secure</span>
            </li>
            <li className="hidden rounded-full border border-white/30 px-3 py-1.5 sm:block">
              <span className="night:hidden">Optical</span>
              <span className="hidden night:inline">EO/IR</span>
            </li>
          </ul>
        </div>

        <DroneBay id="demo" pose={DEMO_POSE} className="lg:mx-[12%]" />

        <div className="grid items-end gap-6 lg:grid-cols-12">
          <h2 id="demo-title" className="display text-[clamp(56px,11vw,196px)] lg:col-span-8">
            <span className="block overflow-hidden pt-[0.05em]">
              <span data-demo-line className="block">
                {demo.title}
              </span>
            </span>
          </h2>
          <div data-demo-fade className="flex flex-col gap-6 pb-2 lg:col-span-4 lg:items-end lg:text-right">
            <p className="max-w-sm text-[15px] leading-relaxed text-white/85">{demo.text}</p>
            <a href="#contact" className="pill pill-solid">
              Schedule a field demo
              <ArrowRight size={15} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
