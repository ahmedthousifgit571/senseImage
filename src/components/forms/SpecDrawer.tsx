'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileText, X } from 'lucide-react';
import { company } from '@/content/site';
import { gsap, REDUCED, useGSAP } from '@/lib/gsap';
import { useModal } from '@/lib/useModal';
import { SPEC_OPEN } from '@/lib/util';
import { Field, mailto, validEmail } from '@/components/forms/fields';

type Values = { name: string; company: string; designation: string; email: string; terms: boolean; newsletter: boolean };
const EMPTY: Values = { name: '', company: '', designation: '', email: '', terms: false, newsletter: false };

/** "Request Specification Document (PDF)": the same fields as senseimage.in, sent as an email draft. */
export default function SpecDrawer() {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [sent, setSent] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useModal(open, close, root);

  useEffect(() => {
    const onOpen = () => {
      setSent(false);
      setOpen(true);
    };
    window.addEventListener(SPEC_OPEN, onOpen);
    return () => window.removeEventListener(SPEC_OPEN, onOpen);
  }, []);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const d = window.matchMedia(REDUCED).matches ? 0.01 : 1;
      if (open) {
        gsap.set(el, { autoAlpha: 1 });
        gsap.fromTo('[data-drawer-scrim]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 * d });
        gsap.fromTo('[data-drawer-panel]', { xPercent: 100, x: 0 }, { xPercent: 0, x: 0, duration: 0.8 * d, ease: 'mission' });
      } else {
        gsap.to('[data-drawer-scrim]', { autoAlpha: 0, duration: 0.3 * d });
        gsap.to('[data-drawer-panel]', { xPercent: 100, x: 0, duration: 0.5 * d, ease: 'power3.in', onComplete: () => gsap.set(el, { autoAlpha: 0 }) });
      }
    },
    { scope: root, dependencies: [open] },
  );

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = 'Please enter your full name.';
    if (!validEmail(values.email)) next.email = 'Please enter a valid email address.';
    if (!values.terms) next.terms = 'Please accept the terms and conditions.';
    setErrors(next);
    if (Object.keys(next).length) {
      // After React has flagged the fields.
      requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    window.location.assign(mailto(company.email, 'IndraKavach specification document request', [
      ['Full name', values.name],
      ['Company', values.company],
      ['Designation', values.designation],
      ['Official email', values.email],
      ['Newsletter', values.newsletter ? 'Yes' : 'No'],
    ]));
    setSent(true);
  };

  return (
    <div ref={root} className="invisible fixed inset-0 z-[90] opacity-0" inert={!open} role="dialog" aria-modal="true" aria-labelledby="spec-title">
      <div data-drawer-scrim onClick={close} className="absolute inset-0 bg-[rgb(4_8_17/0.6)] backdrop-blur-sm" />
      <div
        data-drawer-panel
        data-lenis-prevent
        className="tone-graphite absolute inset-y-0 right-0 flex w-[min(560px,100vw)] flex-col overflow-y-auto border-l border-rule shadow-[-40px_0_80px_rgb(0_0_0/0.35)]"
      >
        <div className="flex items-center justify-between px-7 pt-7 sm:px-10">
          <span className="telemetry text-[10px] text-mute">IndraKavach {'//'} Spec sheet</span>
          <button type="button" data-first onClick={close} aria-label="Close" className="grid size-11 place-items-center rounded-full border border-rule hover:border-accent hover:text-accent">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 px-7 pt-10 pb-10 sm:px-10">
          <FileText className="text-accent" size={30} strokeWidth={1.2} />
          <h2 id="spec-title" className="headline mt-6 text-[clamp(34px,4vw,48px)]">
            Request specification <span className="dim">document</span>
          </h2>
          {sent ? (
            <div role="status" className="mt-8 rounded-3xl border border-accent/50 bg-panel p-7">
              <CheckCircle2 className="text-accent" size={26} strokeWidth={1.5} />
              <p className="mt-4 text-lg font-medium">Your request is ready to send.</p>
              <p className="mt-2 text-[15px] leading-relaxed text-mute">
                Your email app has opened with the request addressed to {company.email}. If it didn&apos;t, write to us there and the team will send the technical
                specification sheet to your official email.
              </p>
              <button type="button" onClick={close} className="pill mt-7">
                Back to IndraKavach
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="mt-8 space-y-6">
              <p className="text-[15px] leading-relaxed text-mute">Enter your details to access the technical specification sheet.</p>
              <Field id="spec-name" label="Full name" required value={values.name} error={errors.name} onChange={(v) => set('name', v)} autoComplete="name" />
              <Field id="spec-company" label="Company name" value={values.company} onChange={(v) => set('company', v)} autoComplete="organization" />
              <Field id="spec-designation" label="Designation" value={values.designation} onChange={(v) => set('designation', v)} autoComplete="organization-title" />
              <Field id="spec-email" label="Official email ID" type="email" required value={values.email} error={errors.email} onChange={(v) => set('email', v)} autoComplete="email" />
              <div className="space-y-3 pt-2">
                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[14px] text-mute">
                  <input
                    type="checkbox"
                    checked={values.terms}
                    aria-invalid={!!errors.terms}
                    aria-describedby={errors.terms ? 'spec-terms-error' : undefined}
                    onChange={(e) => set('terms', e.target.checked)}
                    className="mt-0.5 size-5 shrink-0 accent-(--t-accent)"
                  />
                  <span>
                    I agree to the{' '}
                    <a href={company.terms} target="_blank" rel="noreferrer" className="text-ink underline underline-offset-4">
                      terms &amp; conditions
                    </a>
                    . <span className="text-accent">*</span>
                  </span>
                </label>
                {errors.terms && (
                  <p id="spec-terms-error" role="alert" className="text-[13px] text-[#ff8a8a]">
                    {errors.terms}
                  </p>
                )}
                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[14px] text-mute">
                  <input type="checkbox" checked={values.newsletter} onChange={(e) => set('newsletter', e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-(--t-accent)" />
                  Keep me posted on SenseImage news.
                </label>
              </div>
              <button type="submit" className="pill pill-solid w-full justify-between">
                Download now
                <span className="pill-icon">
                  <FileText size={15} strokeWidth={1.6} />
                </span>
              </button>
              <p className="text-[13px] text-mute">Your information is handled securely and not shared with third parties.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
