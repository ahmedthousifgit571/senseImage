'use client';

import { useRef } from 'react';
import { shift } from '@/content/site';
import DroneBay from '@/components/flight/DroneBay';
import { setPose } from '@/lib/flight';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';

// The drone crosses the band above the statement, right to left, banking as it goes.
const FLYBY = { x: 1.08, y: 0.5, fill: 0.6, yaw: -3.0, pitch: -0.05, roll: 0.12, camYaw: 0, camPitch: -0.12, rotor: 1.5, speed: 0.4 };

/** stillform's white-wash pause, turned toward industrial work. */
export default function Shift() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Progress follows the lane itself: the drone joins it beyond the right edge, so it never crosses the copy.
      const flyby = ScrollTrigger.create({
        trigger: root.current?.querySelector('[data-bay="flyby"]'),
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const p = self.progress;
          setPose('flyby', { x: 1.12 - p * 1.3, roll: 0.12 + Math.sin(p * Math.PI) * 0.1, pitch: -0.05 - p * 0.08 });
        },
      });
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from('[data-shift-line]', {
          yPercent: 110,
          duration: 1.3,
          ease: 'mission',
          stagger: 0.12,
          scrollTrigger: { trigger: '[data-shift-copy]', start: 'top 72%' },
        });
      });
      return () => {
        flyby.kill();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} data-chrome="wash" aria-labelledby="shift-title" className="tone-wash relative z-20 overflow-hidden">
      {/* The drone's lane runs under the statement, clear of the copy and the nav. */}
      <div className="relative grid min-h-[110svh] grid-rows-[1fr_auto_minmax(32svh,1fr)] gap-y-6 px-(--gutter) pt-(--section-y) pb-[6svh]">
        <div data-shift-copy className="row-start-2 text-center">
          <p className="eyebrow">{shift.eyebrow}</p>
          <h2 id="shift-title" className="headline mt-6 text-[clamp(44px,7.4vw,128px)]">
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-shift-line className="block">
                {shift.line[0]}
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-shift-line className="dim block">
                {shift.line[1]}
              </span>
            </span>
          </h2>
        </div>
        <DroneBay id="flyby" pose={FLYBY} fallback={false} className="row-start-3" />
      </div>
    </section>
  );
}
