'use client';

import { useRef, useState } from 'react';
import { Crosshair, FileText, LockKeyhole, Monitor, Plane, Plus, Radar, RadioTower, ShieldCheck } from 'lucide-react';
import { indrakavach } from '@/content/site';
import { gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';
import { cn, openSpecDrawer, pad2 } from '@/lib/util';

const LAYER_ICONS = [Plane, Radar, Monitor, RadioTower];
const ASSURANCE_ICONS = [Crosshair, LockKeyhole, ShieldCheck];

/** Seconds for the data link to run from one layer to the next. */
const HOP = 0.55;

/** The evaluator's brief: architecture, assurance, where it works, and the questions asked first. */
export default function System() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const section = root.current;
        if (!section) return;

        // Headlines rise word by word through masks, as in the IndraKavach statement.
        const splits = gsap.utils.toArray<HTMLElement>('[data-split]').map((el) => {
          const split = SplitText.create(el, { type: 'words', mask: 'words', wordsClass: 'split-word' });
          gsap.fromTo(
            split.words,
            { yPercent: 115, rotate: 3, transformOrigin: '0% 100%' },
            { yPercent: 0, rotate: 0, duration: 1.1, ease: 'mission', stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 85%', once: true } },
          );
          return split;
        });
        gsap.utils.toArray<HTMLElement>('[data-fade]').forEach((el) =>
          gsap.fromTo(el, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'mission', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
        );

        // The data link runs layer to layer: each node locks as the link reaches it and its copy
        // settles in. Once the chain is live, a packet keeps travelling it while it's on screen.
        const nodes = gsap.utils.toArray<HTMLElement>('[data-node]');
        const links = gsap.utils.toArray<HTMLElement>('[data-link]');
        const chain = gsap.timeline({ paused: true });
        nodes.forEach((node, i) => {
          const at = i * HOP;
          const ring = node.querySelector<HTMLElement>('[data-ring]');
          chain
            .add(() => ring?.setAttribute('data-on', ''), at)
            .fromTo(node.querySelector('[data-pulse]'), { scale: 1, autoAlpha: 0.9 }, { scale: 2, autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, at)
            .fromTo(node.querySelector('[data-node-copy]'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'mission' }, at);
          if (links[i]) chain.fromTo(links[i], { '--p': 0 }, { '--p': 1, duration: HOP, ease: 'power1.inOut' }, at);
        });

        const packet = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.4 });
        links.forEach((link, i) => packet.fromTo(link, { '--k': 0 }, { '--k': 1, duration: HOP * 2, ease: 'none' }, i * HOP));

        let live = false;
        chain.eventCallback('onComplete', () => {
          live = true;
          packet.play();
        });
        ScrollTrigger.create({ trigger: '[data-chain]', start: 'top 72%', once: true, onEnter: () => chain.play() });
        ScrollTrigger.create({
          trigger: '[data-chain]',
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            if (live) packet.paused(!self.isActive);
          },
        });

        gsap.fromTo(
          '[data-assure]',
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: 'mission', stagger: 0.1, scrollTrigger: { trigger: '[data-assure-list]', start: 'top 85%', once: true } },
        );

        // Application rows draw their rule and rise in batches; then each lights while it sits on the
        // middle of the screen. Detail stays shown until the scan is armed, so nothing is lost without it.
        const rows = gsap.utils.toArray<HTMLElement>('[data-app]');
        const parts = (batch: Element[], sel: string) => batch.map((r) => r.querySelector(sel));
        gsap.set(parts(rows, '[data-app-rule]'), { scaleX: 0 });
        gsap.set(parts(rows, '[data-app-body]'), { autoAlpha: 0, y: 22 });
        ScrollTrigger.batch(rows, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) => {
            gsap.to(parts(batch, '[data-app-rule]'), { scaleX: 1, duration: 1, ease: 'mission', stagger: 0.08 });
            gsap.to(parts(batch, '[data-app-body]'), { autoAlpha: 1, y: 0, duration: 0.9, ease: 'mission', stagger: 0.08 });
          },
        });
        // One row at a time: the row on the screen's centre line is the live one.
        const scan = section.querySelector('[data-apps]');
        scan?.classList.add('app-scan');
        rows.forEach((trigger) => ScrollTrigger.create({ trigger, start: 'top center', end: 'bottom center', toggleClass: 'is-live' }));

        return () => {
          splits.forEach((s) => s.revert());
          scan?.classList.remove('app-scan');
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="system" data-chrome="graphite" aria-labelledby="system-title" className="tone-graphite relative z-20 py-(--section-y)">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p data-fade className="eyebrow">
              System architecture
            </p>
            <h2 id="system-title" data-split className="headline mt-5 text-[clamp(38px,5vw,84px)]">
              Integrated multi-layer <span className="dim">interception.</span>
            </h2>
          </div>
          <p data-fade className="max-w-md text-[15px] leading-relaxed text-mute lg:col-span-4 lg:col-start-9">
            {indrakavach.body}
          </p>
        </div>

        {/* Four layers on one secure data link: a vertical chain when stacked, a row on desktop. */}
        <ol data-chain className="mt-16 grid gap-y-10 lg:mt-24 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-0">
          {indrakavach.architecture.map((layer, i) => {
            const Icon = LAYER_ICONS[i];
            return (
              <li key={layer.title} data-node className="relative grid grid-cols-[3.5rem_1fr] gap-5 lg:flex lg:flex-col lg:items-center lg:text-center">
                {i < indrakavach.architecture.length - 1 && (
                  <span
                    aria-hidden
                    data-link
                    className="absolute top-14 left-7 h-[calc(100%-1rem)] w-0.5 -translate-x-1/2 overflow-hidden bg-rule lg:top-7 lg:left-[calc(50%+1.75rem)] lg:h-0.5 lg:w-[calc(100%-1.5rem)] lg:translate-x-0 lg:-translate-y-1/2"
                  >
                    <span className="link-fill absolute inset-0 bg-signal" />
                    <span className="link-packet absolute inset-0" />
                  </span>
                )}
                <span
                  data-ring
                  className="relative grid size-14 place-items-center rounded-full border border-rule bg-tone text-ink/70 transition-[color,border-color,box-shadow] duration-500 data-on:border-signal data-on:text-signal data-on:shadow-[0_0_28px_-8px_var(--signal)] motion-reduce:border-signal motion-reduce:text-signal"
                >
                  <span aria-hidden data-pulse className="absolute -inset-px rounded-full border border-signal opacity-0" />
                  <Icon size={20} strokeWidth={1.4} />
                </span>
                <div data-node-copy className="pt-1 lg:pt-0">
                  <p className="label text-[9px] text-mute">Layer {pad2(i + 1)}</p>
                  <h3 className="mt-2 text-[20px] leading-tight font-medium tracking-[-0.02em]">{layer.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-mute">{layer.text}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-(--section-y) grid gap-16 lg:grid-cols-12 lg:gap-10">
          {/* Assurance holds its place while the applications and questions scroll past. */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--frame-y)+96px)]">
              <p data-fade className="eyebrow">
                Operational assurance
              </p>
              <h2 data-split className="headline mt-5 text-[clamp(32px,3.6vw,58px)]">
                Mission-ready <span className="dim">by design.</span>
              </h2>
              <ul data-assure-list className="mt-10 grid gap-3">
                {indrakavach.reliability.map((r, i) => {
                  const Icon = ASSURANCE_ICONS[i];
                  return (
                    <li key={r.title} data-assure className="flex gap-4 rounded-(--radius) border border-rule bg-panel p-5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-rule text-signal">
                        <Icon size={18} strokeWidth={1.5} />
                      </span>
                      <div>
                        <h3 className="text-[17px] font-medium tracking-[-0.015em]">{r.title}</h3>
                        <p className="mt-1 text-[14px] leading-relaxed text-mute">{r.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <p data-fade className="eyebrow">
              Applications
            </p>
            <ul data-apps className="mt-6 border-b border-rule">
              {indrakavach.applications.map((a, i) => (
                <li key={a.title} data-app className="app-row relative">
                  <span aria-hidden data-app-rule className="absolute inset-x-0 top-0 h-px origin-left bg-rule" />
                  <span aria-hidden className="app-bar absolute top-4 bottom-4 -left-4 w-0.5 bg-signal max-sm:hidden" />
                  <div data-app-body className="grid grid-cols-[44px_1fr] items-baseline gap-x-3 gap-y-1 py-5 sm:grid-cols-[44px_1fr_1fr]">
                    <span className="app-num label text-[10px] text-mute">{pad2(i + 1)}</span>
                    <h3 className="app-title text-[clamp(21px,1.9vw,28px)] leading-tight font-medium tracking-[-0.02em]">{a.title}</h3>
                    <p className="app-detail col-start-2 text-[14px] text-mute sm:col-start-3">{a.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div data-fade className="mt-14 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <p className="eyebrow">Technical FAQ</p>
              <button type="button" onClick={openSpecDrawer} className="link-arrow">
                <span>Full specification</span>
                <FileText size={15} strokeWidth={1.5} />
              </button>
            </div>
            <div data-fade className="mt-5 border-t border-rule">
              {indrakavach.faq.map((f, i) => {
                const on = open === i;
                return (
                  <div key={f.q} className="border-b border-rule [overflow-anchor:none]">
                    <h3>
                      <button
                        type="button"
                        aria-expanded={on}
                        aria-controls={`faq-${i}`}
                        onClick={() => setOpen(on ? null : i)}
                        className="flex min-h-15 w-full items-center justify-between gap-6 py-4 text-left text-[17px] font-medium tracking-[-0.015em]"
                      >
                        {f.q}
                        <Plus size={18} strokeWidth={1.4} className={cn('shrink-0 transition-transform duration-500 ease-expo', on && 'rotate-45')} />
                      </button>
                    </h3>
                    <div
                      id={`faq-${i}`}
                      role="region"
                      className={cn('grid transition-[grid-template-rows] duration-500 ease-expo', on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
                      onTransitionEnd={() => ScrollTrigger.refresh()}
                    >
                      <p className="overflow-hidden pr-10 text-[14px] leading-relaxed text-mute">
                        <span className="block pb-5">{f.a}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
