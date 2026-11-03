'use client';

import { useRef } from 'react';
import { about, company, stats } from '@/content/site';
import WashEdge from '@/components/flight/WashEdge';
import DualImage from '@/components/media/DualImage';
import { countUp } from '@/lib/anime';
import { gsap, MOTION_OK, SplitText, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/util';

// Prints on a light table around the title: left %, top %, width (vw), rotation (deg).
const SCATTER: [number, number, number, number][] = [
  [3, 15, 15, -5],
  [76, 10, 14, 4],
  [84, 47, 12.5, -3],
  [4, 58, 13, 5],
  [22, 76, 11.5, -4],
  [63, 75, 14, 3],
  [43, 85, 10, -2],
];

// Phones show the first four prints, all kept below the title and clear of the centre print.
const SCATTER_PHONE: [number, number][] = [
  [4, 26],
  [62, 23],
  [64, 70],
  [5, 72],
];

const nf = new Intl.NumberFormat('en-IN');

export default function About() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = stage.current;
        const chip = el?.querySelector<HTMLElement>('[data-chip]');
        const slot = el?.querySelector<HTMLElement>('[data-chip-slot]');
        if (!el || !chip || !slot) return;
        const cards = gsap.utils.toArray<HTMLElement>('[data-card]');
        // Phones stack the prints in two columns under the title (SCATTER_PHONE), so they lift less
        // and leave sideways; flying out along the desktop scatter would carry them through the title.
        const phone = () => window.innerWidth < 640;
        const spot = (i: number) => SCATTER_PHONE[i] ?? SCATTER[i];
        const nums = gsap.utils.toArray<HTMLElement>('[data-count]');
        nums.forEach((n) => (n.textContent = '0'));
        const split = SplitText.create('[data-statement]', { type: 'words', wordsClass: 'inline-block' });

        // The large print in the middle, and the inline slot it shrinks into. Function values are
        // re-measured on every refresh (invalidateOnRefresh), so resizing keeps the landing exact.
        const centre = () => {
          const w = Math.min(Math.max(el.clientWidth * 0.3, 220), 540);
          const h = w * 0.62;
          return { left: (el.clientWidth - w) / 2, top: el.clientHeight * 0.52 - h / 2, width: w, height: h };
        };
        const into = () => {
          const s = slot.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          return { left: s.left - r.left, top: s.top - r.top, width: s.width, height: s.height };
        };
        const from = { left: () => centre().left, top: () => centre().top, width: () => centre().width, height: () => centre().height, borderRadius: 18 };
        const to = { left: () => into().left, top: () => into().top, width: () => into().width, height: () => into().height, borderRadius: 8 };
        gsap.set(chip, { ...centre(), borderRadius: 18 });

        // Prints rise with the sheet as it slides over the hero.
        gsap.from(cards, {
          y: (i) => window.innerHeight * (0.35 + i * 0.05),
          rotation: (i) => SCATTER[i][3] * 2.2,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top top', scrub: 0.8 },
        });
        gsap.from(chip, { y: () => window.innerHeight * 0.45, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top top', scrub: 0.8 } });

        let counted = false;
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=260%',
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (counted || self.progress < 0.84) return;
              counted = true;
              nums.forEach((n, i) => countUp(n, Number(n.dataset.count), { duration: 1800, delay: i * 110 }));
            },
          },
        });
        tl.to(cards, { y: (i) => (phone() ? -10 - i * 4 : -40 - i * 14), rotation: (i) => SCATTER[i][3] * 0.6, duration: 0.3 }, 0)
          .to(
            cards,
            {
              x: (i) => (phone() ? Math.sign(spot(i)[0] - 45) * window.innerWidth * 0.8 : (SCATTER[i][0] - 45) * window.innerWidth * 0.012),
              y: (i) => (phone() ? (spot(i)[1] - 50) * window.innerHeight * 0.004 : (SCATTER[i][1] - 50) * window.innerHeight * 0.016),
              scale: 0.8,
              autoAlpha: 0,
              duration: 0.26,
              ease: 'power2.in',
            },
            0.28,
          )
          .to('[data-about-title]', { y: -60, autoAlpha: 0, duration: 0.2 }, 0.3)
          .fromTo(chip, from, { ...to, duration: 0.28, ease: 'power2.inOut', immediateRender: false }, 0.3)
          // Words stay fully hidden until the prints have cleared, so nothing ever sits behind them.
          .fromTo(split.words, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.012 }, 0.46)
          .fromTo('[data-about-label]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.5)
          .fromTo('[data-about-rule]', { scaleX: 0 }, { scaleX: 1, duration: 0.14 }, 0.8)
          .fromTo('[data-about-fade]', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.04 }, 0.82)
          .to({}, { duration: 0.06 });

        return () => {
          split.revert();
          gsap.set(chip, { clearProps: 'all' });
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="about" aria-labelledby="about-title" className="tone-paper relative z-20">
      <WashEdge />
      <div ref={stage} data-chrome="paper" className="relative min-h-svh overflow-hidden motion-safe:h-svh">
        {/* Light table: prints scattered around the title. Decorative; the statement carries the meaning. */}
        <div aria-hidden className="absolute inset-0 motion-reduce:hidden">
          {about.collage.map((c, i) => {
            const [left, top, w, rot] = SCATTER[i];
            const [pl, pt] = SCATTER_PHONE[i] ?? [left, top];
            return (
              <div
                key={c.src}
                data-card
                className={cn(
                  'absolute top-(--pt) left-(--pl) aspect-4/3 overflow-hidden rounded-xl shadow-[0_24px_48px_-24px_rgb(17_19_22/0.45)] sm:top-(--t) sm:left-(--l)',
                  i > 3 && 'hidden sm:block',
                )}
                style={
                  {
                    '--l': `${left}%`,
                    '--t': `${top}%`,
                    '--pl': `${pl}%`,
                    '--pt': `${pt}%`,
                    width: `max(${w}vw, ${Math.round(w * 9)}px)`,
                    rotate: `${rot}deg`,
                  } as React.CSSProperties
                }
              >
                <DualImage src={c.src} alt="" sizes="(max-width: 768px) 40vw, 16vw" className="size-full" imgClassName="object-cover" />
              </div>
            );
          })}
          <div data-chip className="absolute overflow-hidden rounded-[18px]" style={{ left: '35%', top: '33%', width: '30vw', height: '18.6vw' }}>
            <DualImage src={about.chip.src} alt="" sizes="(max-width: 768px) 60vw, 32vw" className="size-full" imgClassName="object-cover" />
          </div>
        </div>

        <h2
          id="about-title"
          data-about-title
          className="headline absolute inset-x-0 top-[calc(var(--frame-y)+76px)] z-10 px-(--gutter) text-center text-[clamp(28px,3.4vw,54px)] motion-reduce:hidden"
        >
          {about.title[0]}
          <br />
          <span className="dim">{about.title[1]}</span>
        </h2>

        <div className="shell relative flex min-h-svh flex-col justify-center pt-[calc(var(--frame-y)+72px)] pb-14 motion-safe:absolute motion-safe:inset-0">
          <div className="grid gap-y-5 lg:grid-cols-12 lg:gap-x-6">
            <p data-about-label className="label text-[10px] text-mute lg:col-span-2 lg:pt-[0.9em]">
              About
            </p>
            <p className="statement text-[clamp(26px,3.7vw,62px)] lg:col-span-10">
              <span data-chip-slot aria-hidden className="mr-[0.28em] inline-block h-[0.72em] w-[1.8em] rounded-[0.16em] align-[-0.04em]" />
              <span data-statement>{about.statement}</span>
            </p>
          </div>

          <div className="mt-10 grid gap-y-8 lg:mt-14 lg:grid-cols-12 lg:gap-x-6">
            <span data-about-rule aria-hidden className="block h-px origin-left bg-rule lg:col-span-10 lg:col-start-3" />
            <p data-about-fade className="max-w-xs text-[14px] leading-relaxed text-mute lg:col-span-3 lg:col-start-3">
              {company.footerBlurb}
            </p>
            <dl data-about-fade className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:col-span-7">
              {stats.map((s) => (
                <div key={s.unit + s.label} className="flex flex-col gap-2">
                  <dt className="label order-2 text-[9px] leading-snug text-mute">
                    {s.unit} <span className="opacity-60">{'//'}</span> {s.label}
                  </dt>
                  <dd className="order-1 text-[clamp(30px,2.9vw,48px)] leading-none font-medium tracking-[-0.03em] tabular-nums">
                    <span data-count={s.value}>{nf.format(s.value)}</span>
                    <span className="text-mute">{s.suffix}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
