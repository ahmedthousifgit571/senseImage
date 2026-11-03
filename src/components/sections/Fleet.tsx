'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ArrowRight, FileText } from 'lucide-react';
import { payloads, platforms } from '@/content/site';
import DualImage from '@/components/media/DualImage';
import { gsap, MOTION_OK, REDUCED, useGSAP } from '@/lib/gsap';
import { cn, openSpecDrawer, pad2 } from '@/lib/util';

const N = platforms.length;
const TOTAL = N - 1 + 0.5;

/** stillform's split slides: a copy panel and an image panel trade sides as each platform comes up. */
export default function Fleet() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = stage.current;
      if (!el) return;
      const texts = gsap.utils.toArray<HTMLElement>('[data-slide-text]');
      const images = gsap.utils.toArray<HTMLElement>('[data-slide-image]');
      const marks = gsap.utils.toArray<HTMLElement>('[data-slide-mark]');
      const panel = el.querySelector<HTMLElement>('[data-panel-text]');
      const badge = el.querySelector<HTMLElement>('[data-badge]');
      const certify = (i: number) => badge && (badge.style.opacity = platforms[i].typeCertified ? '1' : '0');
      certify(0);
      gsap.set(texts.slice(1), { autoAlpha: 0 });
      gsap.set(images.slice(1), { autoAlpha: 0 });

      let active = 0;
      const show = (i: number) => {
        if (i === active) return;
        const prev = active;
        active = i;
        const quick = window.matchMedia(REDUCED).matches;
        // Stacked, the panels can't trade sides, so the platforms slide through the image panel
        // instead: in from the right going forward, from the left going back.
        const slide = quick || window.matchMedia('(min-width: 64rem)').matches ? 0 : 16 * Math.sign(i - prev);
        gsap.to(texts[prev], { autoAlpha: 0, y: -20, duration: quick ? 0 : 0.35, ease: 'power2.in', overwrite: true });
        gsap.fromTo(texts[i], { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: quick ? 0 : 0.8, delay: quick ? 0 : 0.18, ease: 'mission', overwrite: true });
        gsap.to(images[prev], { autoAlpha: 0, scale: 1.04, xPercent: -slide, duration: quick ? 0 : 0.5, ease: 'power2.inOut', overwrite: true });
        gsap.fromTo(
          images[i],
          { autoAlpha: 0, scale: 0.94, xPercent: slide },
          { autoAlpha: 1, scale: 1, xPercent: 0, duration: quick ? 0 : 0.9, delay: quick ? 0 : 0.1, ease: 'mission', overwrite: true },
        );
        marks.forEach((m, k) => m.toggleAttribute('data-on', k === i));
        certify(i);
        // The copy panel alternates dark and light, as on stillform.
        panel?.classList.toggle('tone-graphite', i % 2 === 0);
        panel?.classList.toggle('tone-wash', i % 2 === 1);
      };

      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_OK, wide: '(min-width: 64rem)' }, (ctx) => {
        const { motion, wide } = ctx.conditions as { motion: boolean; wide: boolean };
        const tl = gsap.timeline({
          defaults: { ease: 'power3.inOut' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${TOTAL * window.innerHeight * 0.85}`,
            pin: true,
            scrub: motion ? 0.6 : true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => show(Math.min(N - 1, Math.round(self.progress * TOTAL - 0.1))),
          },
        });
        if (wide && motion) {
          // Each step the two panels cross the stage, trading sides.
          const shift = () => (el.querySelector<HTMLElement>('[data-panels]')?.clientWidth ?? 0) / 2 + 6;
          for (let k = 1; k < N; k++) {
            const right = k % 2 === 1;
            tl.to('[data-panel-text]', { x: () => (right ? shift() : 0), scale: 1, duration: 0.6 }, k - 0.75)
              .to('[data-panel-image]', { x: () => (right ? -shift() : 0), duration: 0.6 }, k - 0.75)
              .fromTo('[data-panels]', { scale: 1 }, { scale: 0.975, duration: 0.3, ease: 'power2.out', yoyo: true, repeat: 1 }, k - 0.75);
          }
        }
        tl.to({}, { duration: 0.01 }, TOTAL);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="fleet" aria-labelledby="fleet-title" className="tone-paper relative z-20">
      <div ref={stage} data-chrome="paper" className="relative h-svh min-h-[640px] px-(--frame-x) pt-[calc(var(--frame-y)+60px)] pb-(--frame-y)">
        <h2 id="fleet-title" className="sr-only">
          Our drone platforms
        </h2>
        {/* Stacked, the copy gets the larger share so a short phone shows it whole, never scrolling inside a pin. */}
        <div data-panels className="relative grid h-full grid-rows-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-3 lg:block">
          {/* Image panel: the platform on a studio sweep with blueprint rings. */}
          <div
            data-panel-image
            className="relative z-10 row-start-1 overflow-hidden rounded-(--radius) bg-[radial-gradient(90%_80%_at_50%_42%,#ffffff_0%,#e6e2da_62%,#d8d3c9_100%)] night:bg-[radial-gradient(90%_80%_at_50%_42%,#0e2a2c_0%,#081419_62%,#05090e_100%)] lg:absolute lg:inset-y-0 lg:right-0 lg:w-[calc(50%-6px)]"
          >
            <svg aria-hidden viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full text-[#111316]/20 night:text-phosphor/25">
              <g fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke">
                <circle cx="400" cy="300" r="230" strokeDasharray="2 7" />
                <circle cx="400" cy="300" r="150" />
                <path d="M400 40 V560 M90 300 H710" strokeDasharray="4 9" />
              </g>
            </svg>
            {platforms.map((p, i) => (
              <div key={p.id} data-slide-image className={cn('absolute inset-[12%_8%_14%]', i > 0 && 'invisible')}>
                <DualImage src={p.image} alt={p.alt} sizes="(max-width: 1024px) 90vw, 46vw" className="size-full" imgClassName="object-contain drop-shadow-[0_34px_40px_rgb(17_19_22/0.32)]" quality={90} />
              </div>
            ))}
            <p className="telemetry absolute top-5 left-6 text-[10px] text-[#111316]/60 night:text-phosphor/70">SI {'//'} Fleet</p>
            <div data-badge className="absolute right-5 bottom-5 opacity-0 transition-opacity duration-500">
              <Image src="/media/certs/dgca-type-certified.webp" alt="DGCA Type Certified" width={400} height={400} className="size-16 sm:size-20" />
            </div>
          </div>

          {/* Copy panel: alternates graphite and light per platform. */}
          <div
            data-panel-text
            className="tone-graphite relative row-start-2 overflow-hidden rounded-(--radius) transition-[background-color,color] duration-700 lg:absolute lg:inset-y-0 lg:left-0 lg:w-[calc(50%-6px)]"
          >
            <div className="grid h-full">
              {platforms.map((p, i) => (
                <article
                  key={p.id}
                  data-slide-text
                  aria-label={p.name}
                  className={cn('col-start-1 row-start-1 flex min-h-0 flex-col justify-between gap-4 overflow-y-auto px-5 py-4 scrollbar-none sm:gap-5 sm:p-9 lg:p-11', i > 0 && 'invisible')}
                >
                  <div>
                    <p className="eyebrow">
                      Platform {pad2(i + 1)} / {pad2(N)}
                    </p>
                    <h3 className="headline mt-2.5 text-[clamp(30px,4.2vw,72px)] sm:mt-4">{p.name}</h3>
                    {/* Short phones drop the role line so the specs and controls fit the panel whole. */}
                    <p className="label mt-2 text-[10px] text-mute sm:mt-3 [@media(max-height:44rem)_and_(max-width:63.99rem)]:hidden">{p.role}</p>
                    <p className="statement mt-5 hidden max-w-[22ch] text-[clamp(20px,1.7vw,28px)] text-mute sm:block">{p.tagline}</p>
                  </div>
                  <div>
                    <dl className="grid grid-cols-2 border-t border-rule">
                      {p.specs.map((s) => (
                        <div key={s.label} className="border-b border-rule py-2.5 pr-3 odd:border-r odd:pr-4 even:pl-4 sm:py-3">
                          <dt className="label text-[9px] text-mute">{s.label}</dt>
                          <dd className="mt-1 text-[15px] leading-snug font-medium sm:mt-1.5 sm:text-[16px]">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <ul className="mt-5 hidden space-y-1.5 text-[14px] text-mute sm:block">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-3">
                          <span aria-hidden className="mt-[0.6em] block h-px w-3 shrink-0 bg-current" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:mt-6">
                      <ol aria-hidden className="flex gap-1.5">
                        {platforms.map((q, k) => (
                          <li
                            key={q.id}
                            data-slide-mark
                            data-on={k === 0 || undefined}
                            className="grid size-8 place-items-center rounded-full border border-rule text-[10px] font-semibold tabular-nums transition-colors duration-500 data-on:border-current sm:size-9"
                          >
                            {pad2(k + 1)}
                          </li>
                        ))}
                      </ol>
                      {p.id === 'indrakavach' ? (
                        <button type="button" onClick={openSpecDrawer} className="link-arrow">
                          <span>Request spec sheet</span>
                          <FileText size={15} strokeWidth={1.5} />
                        </button>
                      ) : (
                        <a href="#contact" className="link-arrow">
                          <span>Enquire</span>
                          <ArrowRight size={15} strokeWidth={1.5} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="shell flex flex-col gap-4 border-t border-rule py-8 md:flex-row md:items-center md:gap-10">
        <p className="eyebrow shrink-0">Compatible payloads</p>
        <ul className="flex flex-wrap gap-2">
          {payloads.map((p) => (
            <li key={p} className="label rounded-full border border-rule px-4 py-2.5 text-[10px]">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
