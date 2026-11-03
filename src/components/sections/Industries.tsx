'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { caseStudy, clients, industries } from '@/content/site';
import DualImage from '@/components/media/DualImage';
import { gsap, MOTION_OK, REDUCED, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn, pad2 } from '@/lib/util';

const ITEMS = industries.items;
const N = ITEMS.length;
const lt = clients.find((c) => c.name === 'Larsen & Toubro');

/** Case study: a small print in the page grows until it is the page. */
function CaseStudy() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.set('[data-case-copy] > *', { autoAlpha: 0, y: 40 });
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: '+=140%',
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              // The nav sits on paper until the photo has filled the screen.
              onUpdate: (self) => (el.dataset.chrome = self.progress > 0.42 ? 'sky' : 'paper'),
            },
          })
          .fromTo('[data-case-frame]', { clipPath: 'inset(30% 34% 30% 34% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.55, ease: 'power2.inOut' }, 0)
          .fromTo('[data-case-img]', { scale: 1.35 }, { scale: 1, duration: 0.6 }, 0)
          .fromTo('[data-case-label]', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 }, 0.05)
          .to('[data-case-copy] > *', { autoAlpha: 1, y: 0, duration: 0.25, stagger: 0.05 }, 0.5)
          .to({}, { duration: 0.15 });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} data-chrome="paper" className="relative h-svh min-h-[600px] overflow-hidden">
      <p data-case-label className="eyebrow absolute top-[calc(var(--frame-y)+76px)] left-1/2 -translate-x-1/2 motion-reduce:hidden">
        {caseStudy.eyebrow}
      </p>
      <div data-case-frame className="absolute inset-0 overflow-hidden">
        <div data-case-img className="absolute inset-0">
          <DualImage src={caseStudy.image.src} alt={caseStudy.image.alt} sizes="100vw" className="size-full" imgClassName="object-cover" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(6_10_18/0.82)_0%,rgb(6_10_18/0.25)_45%,transparent_70%),linear-gradient(to_bottom,rgb(6_10_18/0.35),transparent_25%)]" />
        <div data-case-copy className="absolute inset-x-(--frame-x) bottom-[calc(var(--frame-y)+8px)] grid gap-6 text-white lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow text-white/75">{caseStudy.eyebrow}</p>
            <h2 className="headline mt-5 text-[clamp(36px,5.6vw,96px)]">
              {caseStudy.headline[0]}
              <br />
              <span className="text-white/60">{caseStudy.headline[1]}</span>
            </h2>
          </div>
          <div className="flex flex-col gap-5 lg:col-span-4 lg:items-end lg:text-right">
            {lt?.logo && (
              <span className="grid h-14 w-24 place-items-center rounded-xl bg-white/95 p-2.5">
                <Image src={lt.logo} alt={caseStudy.client} width={lt.w} height={lt.h} className="h-full w-full object-contain" />
              </span>
            )}
            <p className="max-w-xs text-[15px] leading-relaxed text-white/80">{caseStudy.text}</p>
            <a href="#contact" className="link-arrow">
              <span>Discuss a similar project</span>
              <ArrowRight size={15} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/** stillform's apartment gallery: one industry at a time, image left, copy right, the next one waiting. */
function Gallery() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const images = gsap.utils.toArray<HTMLElement>('[data-ind-image]');
      const texts = gsap.utils.toArray<HTMLElement>('[data-ind-text]');
      const nexts = gsap.utils.toArray<HTMLElement>('[data-ind-next]');
      gsap.set([...images.slice(1), ...texts.slice(1), ...nexts.slice(1)], { autoAlpha: 0 });

      let active = 0;
      const show = (i: number) => {
        if (i === active) return;
        const prev = active;
        active = i;
        const q = window.matchMedia(REDUCED).matches ? 0 : 1;
        const down = i > prev;
        gsap.set(images[i], { zIndex: 2 });
        gsap.set(images[prev], { zIndex: 1 });
        gsap.fromTo(
          images[i],
          { autoAlpha: 1, clipPath: down ? 'inset(100% 0% 0% 0% round 24px)' : 'inset(0% 0% 100% 0% round 24px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 0.9 * q, ease: 'power3.inOut', overwrite: true, onComplete: () => gsap.set(images[prev], { autoAlpha: 0 }) },
        );
        const plate = images[i].firstElementChild;
        if (plate) gsap.fromTo(plate, { scale: 1.15 }, { scale: 1, duration: 1.2 * q, ease: 'mission' });
        gsap.to(texts[prev], { autoAlpha: 0, y: down ? -24 : 24, duration: 0.35 * q, ease: 'power2.in', overwrite: true });
        gsap.fromTo(texts[i], { autoAlpha: 0, y: down ? 30 : -30 }, { autoAlpha: 1, y: 0, duration: 0.8 * q, delay: 0.2 * q, ease: 'mission', overwrite: true });
        gsap.to(nexts[prev], { autoAlpha: 0, duration: 0.3 * q, overwrite: true });
        gsap.to(nexts[i], { autoAlpha: 1, duration: 0.6 * q, delay: 0.3 * q, overwrite: true });
        if (counter.current) counter.current.textContent = pad2(i + 1);
      };

      // Pinned while the six industries cycle; useGSAP reverts it on unmount.
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => `+=${(N - 0.5) * window.innerHeight * 0.75}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => show(Math.min(N - 1, Math.floor(self.progress * N))),
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} data-chrome="paper" className="relative h-svh min-h-[640px] overflow-hidden px-(--frame-x) pt-[calc(var(--frame-y)+64px)] pb-(--frame-y)">
      <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-5 lg:grid-cols-12 lg:grid-rows-1 lg:gap-6">
        {/* Big rounded image. */}
        <div className="relative min-h-0 overflow-hidden rounded-(--radius) lg:col-span-7 lg:col-start-2">
          {ITEMS.map((it, i) => (
            <div key={it.title} data-ind-image className={cn('absolute inset-0 overflow-hidden', i > 0 && 'invisible')}>
              <div className="absolute inset-0">
                <DualImage src={it.image} alt={it.alt} sizes="(max-width: 1024px) 92vw, 56vw" className="size-full" imgClassName="object-cover" />
              </div>
            </div>
          ))}
          <p className="telemetry absolute top-4 left-5 z-10 rounded-full bg-black/35 px-3 py-1.5 text-[10px] text-white backdrop-blur-md">SI {'//'} Field ops</p>
        </div>

        {/* Copy column, with the next industry waiting at the bottom. */}
        <div className="relative flex min-h-0 flex-col justify-between gap-6 lg:col-span-4">
          <div className="grid lg:mt-[22svh]">
            {ITEMS.map((it, i) => (
              // Only the first is visible before scripts run, so stacked copy never overlaps.
              <article key={it.title} data-ind-text className={cn('col-start-1 row-start-1', i > 0 && 'invisible')}>
                <p className="eyebrow">{it.title}</p>
                <h3 className="headline mt-4 text-[clamp(30px,3vw,50px)]">
                  {it.lead[0]}
                  <br />
                  <span className="dim">{it.lead[1]}</span>
                </h3>
                <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-mute">{it.text}</p>
                <p className="label mt-4 text-[9px] text-mute">{it.tags.join(' · ')}</p>
              </article>
            ))}
          </div>
          <div className="hidden items-end justify-between gap-4 lg:flex">
            <p className="label text-[10px]">
              Industries{' '}
              <span className="ml-2 tabular-nums">
                <span ref={counter}>01</span>
                <span className="text-mute"> / {pad2(N)}</span>
              </span>
            </p>
            <div className="relative size-[clamp(72px,7vw,104px)] shrink-0 overflow-hidden rounded-xl">
              {ITEMS.map((it, i) => {
                const next = ITEMS[(i + 1) % N];
                return (
                  <div key={it.title} data-ind-next className={cn('absolute inset-0', i > 0 && 'invisible')}>
                    <DualImage src={next.image} alt="" sizes="104px" className="size-full" imgClassName="object-cover" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Clients() {
  const row = [...clients, ...clients];
  return (
    <div className="py-(--section-y)">
      <div className="shell flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <p className="eyebrow">Trusted by India&apos;s infrastructure leaders</p>
        <p className="max-w-md text-[14px] leading-relaxed text-mute">{industries.intro}</p>
      </div>
      <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <ul className="marquee-track flex w-max items-center">
          {row.map((c, i) => (
            <li key={`${c.name}-${i}`} aria-hidden={i >= clients.length} className="flex h-24 w-[min(46vw,250px)] shrink-0 items-center justify-center px-8">
              {c.logo ? (
                <Image src={c.logo} alt={c.name} width={c.w} height={c.h} className="logo-mono h-auto max-h-12 w-auto max-w-full object-contain" />
              ) : (
                <span className="logo-mono text-[30px] font-bold tracking-[0.12em] text-[#1d3f8f] night:text-white">{c.name}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Industries() {
  return (
    <section id="industries" aria-labelledby="industries-title" className="tone-paper relative z-20">
      <h2 id="industries-title" className="sr-only">
        Industries we serve
      </h2>
      <CaseStudy />
      <Gallery />
      <Clients />
    </section>
  );
}
