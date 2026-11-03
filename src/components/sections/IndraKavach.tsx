'use client';

import { useRef } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { indrakavach } from '@/content/site';
import DroneBay from '@/components/flight/DroneBay';
import { scramble } from '@/lib/anime';
import { DEFAULT_POSE, lerpPose, setPose, type Pose } from '@/lib/flight';
import { gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';
import { openSpecDrawer, pad2 } from '@/lib/util';

const STEPS = indrakavach.steps;
const N = STEPS.length;

const pose = (p: Partial<Pose>): Pose => ({ ...DEFAULT_POSE, ...p });

/** The drone inside the window, before the page opens up. */
const WINDOW_POSE = pose({ x: 0.5, y: 0.52, fill: 0.84, yaw: -2.3, pitch: 0.04, camPitch: -0.12 });

/** One framing per capability. The step copy sits in the lower band, so every pose keeps the drone above it. */
const STEP_POSES: Pose[] = [
  // 01 Interception: low three-quarter, nose down in a dash.
  pose({ x: 0.58, y: 0.4, fill: 0.6, yaw: -2.6, pitch: -0.2, roll: 0.14, camYaw: 0.08, camPitch: -0.1, rotor: 1.9, speed: 1 }),
  // 02 GPS-denied: the camera climbs and looks down on the SLAM grid.
  pose({ x: 0.55, y: 0.4, fill: 0.46, yaw: -1.95, camYaw: 0.35, camPitch: -0.95, nav: 1 }),
  // 03 Targeting: in close on the nose sensor, the lock beam level and out to the left, above the copy.
  pose({ x: 0.62, y: 0.36, fill: 0.6, yaw: -2.7, pitch: 0.03, camYaw: -0.12, camPitch: -0.1, lock: 1 }),
  // 04 EO/IR: near profile from slightly above while the thermal sweep runs nose to tail.
  pose({ x: 0.52, y: 0.4, fill: 0.66, yaw: -2.92, camPitch: -0.24, thermal: 1 }),
  // 05 Swarm: pulled right back, wingmen formed up behind.
  pose({ x: 0.62, y: 0.38, fill: 0.3, yaw: -2.55, pitch: 0.02, roll: 0.05, camYaw: 0.12, camPitch: -0.2, rotor: 1.2, swarm: 1 }),
  // 06 Payload: exploded three-quarter from above.
  pose({ x: 0.55, y: 0.42, fill: 0.58, yaw: -0.75, camYaw: -0.25, camPitch: -0.48, rotor: 0.35, explode: 1 }),
  // 07 Deployment: climbing out, nose up.
  pose({ x: 0.58, y: 0.38, fill: 0.5, yaw: -2.15, pitch: 0.2, roll: -0.08, camYaw: 0.15, camPitch: 0.04, rotor: 2 }),
];

// Timeline in scroll units (one unit = one viewport): marquee, window opens, then one unit per capability.
const OPEN_AT = 1;
const STEPS_AT = 2.1;
const TOTAL = STEPS_AT + N + 0.3;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => t * t * (3 - 2 * t);

const MARQUEE = Array.from({ length: 4 }, () => indrakavach.marquee).join(' — ') + ' — ';

/** Clear space between the headline or footer and the band the marquee and window share. */
const BAND_GAP = 24;
/** Two rows at the display line height (0.86) plus their gap must fit the band, whatever the viewport. */
const MARQUEE_SIZE = 'min(clamp(84px, 15vw, 260px), calc((var(--ik-band, calc(100svh - 400px)) - 2svh) / 1.72))';

export default function IndraKavach() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = stage.current;
        const head = el?.querySelector<HTMLElement>('[data-ik-head]');
        const foot = el?.querySelector<HTMLElement>('[data-ik-foot]');
        const title = el?.querySelector<HTMLElement>('#ik-title');
        const eyebrow = el?.querySelector<HTMLElement>('[data-ik-eyebrow]');
        if (!el || !head || !foot || !title || !eyebrow) return;
        const items = gsap.utils.toArray<HTMLElement>('[data-step]');
        const dots = gsap.utils.toArray<HTMLElement>('[data-dot]');
        const fill = el.querySelector<HTMLElement>('[data-rail-fill]');
        gsap.set(items, { autoAlpha: 0, y: 30 });
        gsap.set('[data-steps-ui]', { autoAlpha: 0 });

        let active = -1;
        const show = (i: number) => {
          if (i === active) return;
          const prev = active;
          active = i;
          if (prev >= 0) gsap.to(items[prev], { autoAlpha: 0, y: -24, duration: 0.45, ease: 'power2.in', overwrite: true });
          gsap.fromTo(items[i], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'mission', delay: prev >= 0 ? 0.2 : 0, overwrite: true });
          dots.forEach((d, k) => d.toggleAttribute('data-on', k === i));
          if (num.current) scramble(num.current, pad2(i + 1), { duration: 420 });
        };

        const small = () => window.innerWidth < 768;

        // The headline and footer keep their own bands. The marquee and the window share what lies
        // between, centred on the stage so the window still opens evenly; offsets ignore transforms.
        const band = () => {
          const edge = Math.max(head.offsetTop + head.offsetHeight, el.clientHeight - foot.offsetTop) + BAND_GAP;
          return Math.max(120, el.clientHeight - 2 * edge);
        };
        const fitBand = () => el.style.setProperty('--ik-band', `${band()}px`);
        const windowHeight = (svh: number) => `${Math.min((svh / 100) * el.clientHeight, band())}px`;
        fitBand();
        ScrollTrigger.addEventListener('refreshInit', fitBand);

        // Entrance, once: the eyebrow resolves like a readout while the headline rises word by word
        // through its masks, then the footer settles in. Both ends are explicit so a remount can't
        // inherit the last run's transforms as its resting state.
        const split = SplitText.create(title, { type: 'words', mask: 'words', wordsClass: 'split-word' });
        const label = eyebrow.textContent ?? '';
        const intro = gsap
          .timeline({ paused: true })
          .fromTo(
            [eyebrow, ...split.words],
            { yPercent: 115, y: 0, rotate: 3, transformOrigin: '0% 100%' },
            { yPercent: 0, rotate: 0, duration: 1.1, ease: 'mission', stagger: 0.06 },
          )
          .fromTo('[data-ik-in]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'mission', stagger: 0.08 }, 0.4);
        ScrollTrigger.create({
          trigger: el,
          start: 'top 75%',
          once: true,
          onEnter: () => {
            intro.play();
            scramble(eyebrow, label, { duration: 650 });
          },
        });

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${TOTAL * window.innerHeight}`,
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const t = self.progress * TOTAL;
              let p: Pose;
              if (t < OPEN_AT) p = WINDOW_POSE;
              else if (t < STEPS_AT) p = lerpPose(WINDOW_POSE, STEP_POSES[0], ease(clamp01((t - OPEN_AT) / (STEPS_AT - OPEN_AT))));
              else {
                const s = Math.min(N - 1, Math.floor(t - STEPS_AT));
                const local = t - STEPS_AT - s;
                const k = s < N - 1 ? ease(clamp01((local - 0.55) / 0.45)) : 0;
                p = lerpPose(STEP_POSES[s], STEP_POSES[Math.min(N - 1, s + 1)], k);
              }
              // The step poses lean right to clear the desktop copy; on a phone the copy sits below, so centre
              // up, and move the swarm's lead left so its wingmen, trailing right, stay on screen.
              if (small()) p = { ...p, x: 0.5 + (p.x - 0.5) * 0.25 - p.swarm * 0.16 };
              setPose('ik', p);
              // The nav reads paper while the window sits in the page, sky once it has opened.
              el.dataset.chrome = t > OPEN_AT + 0.5 ? 'sky' : 'paper';
              if (t >= STEPS_AT - 0.35) show(Math.min(N - 1, Math.max(0, Math.floor(t - STEPS_AT + 0.225))));
              if (fill) fill.style.transform = `scaleX(${clamp01((t - STEPS_AT) / (N - 1))})`;
            },
          },
        });

        // 0 → 1: the marquee runs while the window sits in the page.
        tl.fromTo('[data-row="a"]', { xPercent: 0 }, { xPercent: -24, duration: OPEN_AT + 1 }, 0)
          .fromTo('[data-row="b"]', { xPercent: -24 }, { xPercent: 0, duration: OPEN_AT + 1 }, 0)
          .fromTo(
            el,
            // Phones get a narrower window than before so the marquee still reads on both sides of it.
            { '--ww': () => `${small() ? 60 : 34}vw`, '--wh': () => windowHeight(small() ? 40 : 50), '--wr': '26px' },
            { '--ww': () => `${small() ? 68 : 40}vw`, '--wh': () => windowHeight(small() ? 44 : 54), duration: OPEN_AT },
            0,
          )
          // 1 → 2: the window opens onto the sky, and the headline lifts out through its masks word by word.
          // The lift moves y while the entrance moved yPercent, so the two never fight over a value.
          .to(el, { '--ww': '101vw', '--wh': () => `${el.clientHeight * 1.01}px`, '--wr': '0px', duration: 1, ease: 'power2.inOut' }, OPEN_AT)
          .fromTo(
            [eyebrow, ...split.words],
            { y: 0 },
            { y: (_: number, t: HTMLElement) => -t.offsetHeight * 1.2, duration: 0.35, ease: 'power1.in', stagger: 0.03, immediateRender: false },
            OPEN_AT,
          )
          .fromTo(foot, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, OPEN_AT)
          .to('[data-marquee]', { scale: 1.12, autoAlpha: 0, duration: 0.8 }, OPEN_AT + 0.1)
          .to('[data-steps-ui]', { autoAlpha: 1, duration: 0.4 }, STEPS_AT - 0.45)
          .to({}, { duration: TOTAL - STEPS_AT });

        return () => {
          ScrollTrigger.removeEventListener('refreshInit', fitBand);
          split.revert();
        };
      });
      // Without motion the drone holds the upper half and the capabilities list sits below it.
      mm.add('(prefers-reduced-motion: reduce)', () => setPose('ik', { ...STEP_POSES[0], y: 0.24, fill: 0.5, speed: 0 }));
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="indrakavach" data-sky aria-labelledby="ik-title" className="tone-sky relative z-20">
      <div
        ref={stage}
        data-chrome="paper"
        className="relative h-svh min-h-[600px] overflow-hidden [--wh:50svh] [--wr:26px] [--ww:78vw] sm:[--ww:34vw] motion-reduce:h-auto motion-reduce:[--wh:100%] motion-reduce:[--wr:0px] motion-reduce:[--ww:100vw]"
      >
        {/* The page, with a window cut through it: the shadow paints the paper everywhere but the window. */}
        <DroneBay
          id="ik"
          clip
          pose={WINDOW_POSE}
          className="absolute rounded-(--wr) shadow-[0_0_0_200vmax_var(--paper)]"
          style={{ left: 'calc(50% - var(--ww) / 2)', top: 'calc(50% - var(--wh) / 2)', width: 'var(--ww)', height: 'var(--wh)' }}
        />

        {/* Marquee and paper copy, masked out of the window. */}
        <div data-marquee aria-hidden className="ik-window-mask pointer-events-none absolute inset-0 flex flex-col justify-center gap-[2svh] text-(--ink) motion-reduce:hidden">
          <p data-row="a" className="display whitespace-nowrap" style={{ fontSize: MARQUEE_SIZE }}>
            {MARQUEE}
          </p>
          <p data-row="b" className="display whitespace-nowrap text-(--ink)/15" style={{ fontSize: MARQUEE_SIZE }}>
            {MARQUEE}
          </p>
        </div>

        <div className="ik-window-mask absolute inset-0 text-(--ink) motion-reduce:hidden">
          <div data-ik-head className="absolute top-[calc(var(--frame-y)+72px)] right-(--frame-x) left-(--frame-x)">
            <p className="overflow-hidden">
              <span data-ik-eyebrow className="eyebrow flex text-(--ink-muted)">
                Flagship {'//'} Counter-UAV
              </span>
            </p>
            {/* One line from tablet up; on a phone the second clause takes its own line. */}
            <h2 id="ik-title" className="headline mt-4 text-[clamp(26px,2.8vw,48px)] sm:whitespace-nowrap">
              {indrakavach.title} <span className="block text-(--ink-muted) sm:inline">{indrakavach.titleDim}</span>
            </h2>
          </div>
          <div data-ik-foot className="absolute right-(--frame-x) bottom-[calc(var(--frame-y)+8px)] left-(--frame-x) grid grid-cols-[1fr_auto_1fr] items-end">
            <ul data-ik-in className="label hidden flex-col gap-1.5 text-[10px] text-(--ink-muted) lg:flex">
              {indrakavach.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <p data-ik-in className="label col-start-2 flex items-center gap-2 text-[10px]">
              {indrakavach.enter}
              <ArrowDown size={13} strokeWidth={1.6} />
            </p>
          </div>
        </div>

        {/* The walkthrough's chrome: step copy bottom-left, counter bottom-right, progress rail, dot index. */}
        <div data-steps-ui className="pointer-events-none invisible absolute inset-0 motion-reduce:hidden">
          <div aria-hidden className="absolute inset-x-0 top-0 h-[22%] bg-[linear-gradient(to_bottom,rgb(5_10_20/0.42),transparent)]" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(to_top,rgb(5_10_20/0.66),transparent)]" />
          <div aria-hidden className="scanlines absolute inset-0" />

          <ul aria-hidden className="absolute top-1/2 right-(--frame-x) flex -translate-y-1/2 flex-col gap-3 max-lg:hidden">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                data-dot
                data-on={i === 0 || undefined}
                className="size-1.5 rounded-full bg-white/40 transition-[transform,background-color] duration-500 data-on:scale-[1.8] data-on:bg-white"
              />
            ))}
          </ul>

          <div className="pointer-events-auto absolute inset-x-(--frame-x) bottom-[calc(var(--frame-y)+env(safe-area-inset-bottom))]">
            <div className="flex items-end justify-between gap-6">
              <ol className="grid min-w-0 flex-1" aria-label="IndraKavach capabilities">
                {STEPS.map((s, i) => (
                  <li key={s.title} data-step className="invisible col-start-1 row-start-1 max-w-160 motion-reduce:hidden">
                    <p className="eyebrow text-white/70">Capability {pad2(i + 1)}</p>
                    <h3 className="headline mt-3 text-[clamp(32px,4.4vw,72px)]">{s.title}</h3>
                    <p className="label mt-3 text-[10px] text-white/80">{s.caption}</p>
                    <p className="mt-3 max-w-[34ch] text-[13px] leading-relaxed text-white/80 sm:text-[14px] sm:text-white/72">{s.text}</p>
                  </li>
                ))}
              </ol>
              <div className="shrink-0 text-right">
                <p aria-hidden className="text-[clamp(52px,6.4vw,108px)] leading-[0.8] font-medium tracking-[-0.05em] tabular-nums">
                  <span ref={num}>01</span>
                </p>
                <p className="label mt-2 text-[10px] text-white/70">Of {pad2(N)}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-6">
              <div aria-hidden className="relative h-px flex-1 bg-white/25">
                <span data-rail-fill className="absolute inset-0 origin-left scale-x-0 bg-white" />
                {STEPS.map((s, i) => (
                  <span key={s.title} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/50" style={{ left: `${(i / (N - 1)) * 100}%` }} />
                ))}
              </div>
              <button type="button" onClick={openSpecDrawer} className="link-arrow shrink-0 text-white">
                <span>Spec sheet</span>
                <ArrowRight size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Without motion there is no walkthrough, so the capabilities are listed plainly. */}
        <div className="hidden pt-[55svh] motion-reduce:block">
          <ol className="shell relative grid gap-6 pb-(--section-y) sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <p className="label text-[10px] text-white/70">{pad2(i + 1)}</p>
                <h3 className="headline mt-2 text-[26px]">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/75">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
