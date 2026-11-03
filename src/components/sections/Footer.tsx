'use client';

import Image from 'next/image';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { useLenis } from 'lenis/react';
import { company, footer, nav, recognitions } from '@/content/site';
import DroneBay from '@/components/flight/DroneBay';

// Parked in the open middle of the card, rotors winding down.
const PARKED = { x: 0.5, y: 0.5, fill: 0.92, yaw: -2.4, pitch: 0.02, roll: 0, camYaw: 0, camPitch: -0.22, rotor: 0.35 };

/** stillform's closing card: wordmark, the line, where to go next, and the way back up. */
export default function Footer() {
  const lenis = useLenis();

  return (
    <footer data-chrome="paper" className="tone-paper relative z-20 flex min-h-svh flex-col px-(--frame-x) pt-[calc(var(--frame-y)+64px)] pb-[calc(var(--frame-y)+env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col rounded-(--radius) border border-rule px-6 py-6 sm:px-10 sm:py-8">
        <div className="label flex items-center justify-between gap-6 text-[10px]">
          <span>{company.name}</span>
          <span className="text-mute">
            {footer.line[0]} {footer.line[1]}
          </span>
        </div>
        <span aria-hidden className="mt-6 block h-px bg-rule" />

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <p className="headline text-[clamp(52px,7.2vw,124px)]">
              {footer.line[0]}
              <br />
              <span className="dim">{footer.line[1]}</span>
            </p>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-mute">{footer.tagline}</p>
          </div>

          <DroneBay id="parked" pose={PARKED} className="min-h-[26svh] lg:col-span-3 lg:min-h-[38svh]" />

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 lg:col-span-3 lg:col-start-10">
            <div>
              <p className="label text-[9px] text-mute">Explore</p>
              <ul className="mt-4 space-y-2.5">
                {nav.map((n) => (
                  <li key={n.href}>
                    <a href={n.href} className="roll-host text-[15px]">
                      <span className="roll">
                        <span>{n.label}</span>
                        <span aria-hidden>{n.label}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label text-[9px] text-mute">Follow</p>
              <ul className="mt-4 space-y-2.5">
                {company.socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[15px] hover:opacity-70">
                      {s.label} <ArrowUpRight size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <ul aria-label="Recognitions" className="flex flex-wrap items-center gap-2.5 pb-6">
          {recognitions.map((r) => (
            <li key={r.name} className="grid h-12 w-16 place-items-center rounded-lg bg-white p-1.5">
              <Image src={r.logo} alt={r.name} width={160} height={160} className="h-full w-full object-contain" />
            </li>
          ))}
        </ul>

        <span aria-hidden className="block h-px bg-rule" />
        <div className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="label text-[10px]">© 2026 {company.name}</p>
            <p className="label mt-1 text-[9px] text-mute">
              {company.coords.lat} · {company.coords.lon} · {company.coords.label}
            </p>
          </div>
          <p className="label flex items-center gap-2 text-[9px] text-mute">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#22c55e] opacity-60 motion-reduce:hidden" />
              <span className="relative size-2 rounded-full bg-[#22c55e]" />
            </span>
            Systems nominal
          </p>
          <div className="flex items-center gap-6">
            <a href={company.terms} target="_blank" rel="noreferrer" className="label text-[9px] text-mute hover:text-ink">
              Terms &amp; conditions
            </a>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                lenis?.scrollTo(0, { duration: 2.2 });
              }}
              className="label inline-flex min-h-11 items-center gap-2 text-[10px]"
            >
              Back to top <ArrowUp size={13} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
