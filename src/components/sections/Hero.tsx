'use client';

import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { hero } from '@/content/site';
import DroneBay from '@/components/flight/DroneBay';
import { wander } from '@/lib/anime';
import { setGain, setPose } from '@/lib/flight';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { onIntroDone } from '@/lib/util';

export const HERO_POSE = { x: 0.46, y: 0.5, fill: 0.8, yaw: -2.2, pitch: 0.05, roll: 0.04, camYaw: 0.05, camPitch: -0.07, rotor: 1 };

/** Corner ticks and two telemetry readouts, kept inside the bay so they never meet the copy. */
function Hud() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div data-hud className="brackets absolute inset-[4%] text-ink/70 [--b:18px]" />
      <p data-hud className="telemetry halo absolute top-[4%] left-[4%] pt-3 pl-4 font-semibold text-ink">
        TRK IK-01 <span className="text-signal">{'//'} LOCK</span>
      </p>
      <p data-hud className="telemetry halo absolute right-[4%] bottom-[4%] pr-4 pb-3 text-right font-semibold text-ink">
        HDG <span data-hdg>274</span>° · <span className="night:hidden">Optical</span>
        <span className="hidden night:inline">EO/IR</span>
      </p>
    </div>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const stops: (() => void)[] = [];
        gsap.set('[data-hero-line]', { yPercent: 110 });
        gsap.set('[data-hero-fade]', { autoAlpha: 0, y: 24 });
        gsap.set('[data-hud]', { autoAlpha: 0, scale: 0.96 });

        const intro = gsap
          .timeline({ paused: true })
          .to('[data-hero-line]', { yPercent: 0, duration: 1.3, ease: 'mission', stagger: 0.1 }, 0.1)
          .to('[data-hero-fade]', { autoAlpha: 1, y: 0, duration: 1, ease: 'mission', stagger: 0.08 }, 0.5)
          .to('[data-hud]', { autoAlpha: 1, scale: 1, duration: 1.1, ease: 'mission', stagger: 0.08 }, 0.7)
          .add(() => {
            const hdg = root.current?.querySelector<HTMLElement>('[data-hdg]');
            if (hdg) stops.push(wander(hdg, 274, 5));
          }, 1.2);
        stops.push(onIntroDone(() => intro.play()));
        return () => stops.forEach((stop) => stop());
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // As the next sheet slides over the sticky hero, the copy lifts away and the drone climbs out.
  useGSAP(
    () => {
      const next = root.current?.nextElementSibling;
      if (!next) return;
      const st = ScrollTrigger.create({
        trigger: next,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          setGain('hero', 1 - gsap.parseEase('power1.in')(Math.min(1, p * 1.5)));
          setPose('hero', { camPitch: HERO_POSE.camPitch - p * 0.35, pitch: HERO_POSE.pitch + p * 0.3 });
        },
      });
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.to('[data-hero-ui]', { yPercent: -12, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true } });
      });
      return () => {
        st.kill();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      data-sky
      data-chrome="horizon"
      aria-labelledby="hero-title"
      className="tone-horizon sticky top-0 z-0 h-svh min-h-[620px] overflow-hidden short:min-h-[480px]"
    >
      <div aria-hidden className="horizon-scrim absolute inset-0" />
      <div aria-hidden className="scanlines absolute inset-0" />

      <div
        data-hero-ui
        className="relative grid h-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto_auto] px-(--frame-x) pt-[calc(var(--frame-y)+68px)] pb-[calc(var(--frame-y)+env(safe-area-inset-bottom))] [grid-template-areas:'title'_'bay'_'copy'_'base'] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:[grid-template-areas:'title_title'_'copy_bay'_'base_base']"
      >
        <div className="[grid-area:title]">
          <p className="overflow-hidden">
            <span data-hero-line className="eyebrow block text-[12px] font-bold text-ink">
              {hero.eyebrow}
            </span>
          </p>
          <h1 id="hero-title" className="display mt-4 text-[clamp(38px,9.6vw,172px)] whitespace-nowrap text-(--horizon-display) lg:mt-5">
            <span className="block overflow-hidden pt-[0.06em]">
              <span data-hero-line className="block">
                {hero.title}
              </span>
            </span>
            <span className="sr-only">, {hero.line}</span>
          </h1>
        </div>

        <DroneBay id="hero" pose={HERO_POSE} eager className="min-h-[30svh] [grid-area:bay] lg:-mr-[2vw] lg:mb-2">
          <Hud />
        </DroneBay>

        <div className="mt-4 flex flex-col justify-end gap-6 pb-6 [grid-area:copy] lg:mt-0 lg:max-w-[30rem] lg:pb-10">
          <p className="overflow-hidden">
            <span data-hero-line aria-hidden className="headline block text-[clamp(24px,2.5vw,42px)] font-semibold text-(--horizon-display)">
              {hero.line}
            </span>
          </p>
          <p data-hero-fade className="max-w-[28rem] text-[16px] leading-relaxed font-medium text-ink lg:text-[17px]">
            {hero.caption[0]} {hero.caption[1]}
          </p>
          <div data-hero-fade className="flex flex-wrap gap-x-8 gap-y-1">
            {hero.ctas.map((c) => (
              <a key={c.href} href={c.href} className="link-arrow text-[13px] font-bold">
                <span>{c.label}</span>
                <ArrowRight size={15} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        <div data-hero-fade className="flex min-h-11 items-center border-t border-rule pt-3 [grid-area:base]">
          <p className="label text-[10px] font-bold sm:text-[11px]">
            {hero.labels.left} <span className="opacity-60">{'//'}</span> {hero.labels.middle}
          </p>
        </div>
      </div>
    </section>
  );
}
