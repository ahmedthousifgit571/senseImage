'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, CheckCircle2, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { certifications, company, fieldDemo, leadership } from '@/content/site';
import { Field, mailto, validEmail } from '@/components/forms/fields';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/util';

type ModeId = (typeof fieldDemo.modes)[number]['id'];
type Values = { name: string; org: string; role: string; email: string; phone: string; needs: string };
const EMPTY: Values = { name: '', org: '', role: '', email: '', phone: '', needs: '' };
const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address.join(' '))}`;

function BookingForm() {
  const [mode, setMode] = useState<ModeId>('defence');
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [sent, setSent] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const current = fieldDemo.modes.find((m) => m.id === mode) ?? fieldDemo.modes[0];

  const set = (key: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = 'Please enter your name.';
    if (!values.org.trim()) next.org = 'Please enter your organisation.';
    if (!validEmail(values.email)) next.email = 'Please enter a valid email address.';
    if (values.phone && values.phone.replace(/\D/g, '').length < 8) next.phone = 'Please enter a valid phone number, with country code.';
    if (values.needs.trim().length < 10) next.needs = 'Tell us a little about the mission, at least a sentence.';
    setErrors(next);
    if (Object.keys(next).length) {
      // After React has flagged the fields.
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    window.location.assign(
      mailto(company.email, current.subject, [
        ['Request', current.label],
        ['Name', values.name],
        ['Organisation', values.org],
        ['Role', values.role],
        ['Email', values.email],
        ['Phone', values.phone],
        ['Mission requirements', values.needs],
      ]),
    );
    setSent(true);
  };

  if (sent) {
    return (
      <div role="status" className="rounded-(--radius) border border-rule bg-panel p-8 sm:p-10">
        <CheckCircle2 size={28} strokeWidth={1.4} />
        <p className="headline mt-6 text-[clamp(28px,2.8vw,42px)]">
          Request ready. <span className="dim">Over to you.</span>
        </p>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-mute">
          Your email app has opened with the {current.label.toLowerCase()} request addressed to {company.email}. Send it and the team replies within one business day. If nothing
          opened, write to us directly or call {company.phone}.
        </p>
        <button type="button" onClick={() => setSent(false)} className="pill mt-8">
          Edit the request
        </button>
      </div>
    );
  }

  return (
    <form ref={form} noValidate onSubmit={submit} className="rounded-(--radius) border border-rule bg-panel p-6 sm:p-10">
      <div role="radiogroup" aria-label="Request type" className="grid grid-cols-2 gap-1 rounded-full border border-rule p-1">
        {fieldDemo.modes.map((m) => {
          const on = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setMode(m.id)}
              className={cn('label min-h-12 rounded-full px-3 text-[10px] leading-tight transition-colors duration-300', on ? 'bg-ink text-tone' : 'text-mute hover:text-ink')}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <Field id="demo-name" label="Name" required value={values.name} error={errors.name} onChange={(v) => set('name', v)} autoComplete="name" />
        <Field id="demo-org" label="Organisation" required value={values.org} error={errors.org} onChange={(v) => set('org', v)} autoComplete="organization" />
        <Field id="demo-role" label="Role" value={values.role} onChange={(v) => set('role', v)} autoComplete="organization-title" />
        <Field id="demo-email" label="Official email" type="email" required value={values.email} error={errors.email} onChange={(v) => set('email', v)} autoComplete="email" />
        <Field id="demo-phone" label="Phone" type="tel" value={values.phone} error={errors.phone} onChange={(v) => set('phone', v)} autoComplete="tel" placeholder="+91" />
        <Field
          id="demo-needs"
          label="Mission requirements"
          required
          multiline
          value={values.needs}
          error={errors.needs}
          onChange={(v) => set('needs', v)}
          placeholder={mode === 'defence' ? 'Site, threat profile, integration with existing radar or RF detection…' : 'Asset type, corridor length or area, deliverables, timeline…'}
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-[13px] leading-relaxed text-mute">{company.replyTime} Your details are not shared with third parties.</p>
        <button type="submit" className="pill pill-solid">
          {mode === 'defence' ? 'Request field demo' : 'Request consultation'}
          <Send size={14} strokeWidth={1.6} />
        </button>
      </div>
    </form>
  );
}

export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from('[data-contact-reveal]', { y: 50, autoAlpha: 0, duration: 1.1, ease: 'mission', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 70%' } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="contact" data-chrome="paper" aria-labelledby="contact-title" className="tone-paper relative z-20 py-(--section-y)">
      <div className="shell">
        <div data-contact-reveal className="max-w-5xl">
          <p className="eyebrow">Schedule a field demo</p>
          <h2 id="contact-title" className="headline mt-6 text-[clamp(38px,5.4vw,92px)]">
            {fieldDemo.callout} <span className="dim">{fieldDemo.calloutDim}</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-10">
          <div data-contact-reveal className="lg:col-span-7">
            <BookingForm />
          </div>

          <aside data-contact-reveal className="flex flex-col gap-9 lg:col-span-4 lg:col-start-9">
            <div>
              <p className="eyebrow">Mission desk</p>
              <a href={`mailto:${company.email}`} className="mt-5 flex items-center gap-3 text-[clamp(20px,1.8vw,28px)] tracking-[-0.02em] hover:opacity-70">
                <Mail size={20} strokeWidth={1.3} />
                {company.email}
              </a>
              <a href={company.phoneHref} className="mt-2 flex items-center gap-3 text-[clamp(20px,1.8vw,28px)] tracking-[-0.02em] hover:opacity-70">
                <Phone size={20} strokeWidth={1.3} />
                {company.phone}
              </a>
            </div>
            <div className="grid gap-6 border-t border-rule pt-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <p className="label flex items-center gap-2 text-[9px] text-mute">
                  <MapPin size={12} /> Office
                </p>
                <address className="mt-3 text-[14px] leading-relaxed not-italic">
                  {company.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
                <a href={mapHref} target="_blank" rel="noreferrer" className="label mt-2 inline-flex min-h-11 items-center gap-1 text-[9px]">
                  Open in maps <ArrowUpRight size={12} />
                </a>
              </div>
              <div>
                <p className="label flex items-center gap-2 text-[9px] text-mute">
                  <Clock size={12} /> Hours
                </p>
                <p className="mt-3 text-[14px] leading-relaxed">{company.hours}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-mute">{company.replyTime}</p>
              </div>
            </div>
            <div className="border-t border-rule pt-8">
              <p className="label text-[9px] text-mute">Certifications</p>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {certifications.map((c) => (
                  <li key={c.name} className="grid size-18 place-items-center rounded-2xl bg-white p-2">
                    <Image src={c.logo} alt={c.name} width={160} height={160} className="h-full w-full object-contain" />
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <div data-contact-reveal className="mt-(--section-y) border-t border-rule pt-10">
          <p className="eyebrow">Leadership</p>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {leadership.map((l) => (
              <li key={l.name}>
                <p className="text-[17px] font-medium tracking-[-0.015em]">{l.name}</p>
                <p className="label mt-1.5 text-[9px] text-mute">{l.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
