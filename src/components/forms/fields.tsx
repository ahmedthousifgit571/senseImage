'use client';

import { cn } from '@/lib/util';

export const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Builds a mailto: link whose body lists the form's fields, one per line. */
export function mailto(to: string, subject: string, rows: [string, string][]) {
  const body = rows
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  autoComplete?: string;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
};

export function Field({ id, label, value, onChange, error, required, type = 'text', autoComplete, multiline, placeholder, className }: FieldProps) {
  const describedBy = error ? `${id}-error` : undefined;
  const shared = {
    id,
    name: id,
    value,
    required,
    placeholder,
    autoComplete,
    'aria-invalid': !!error,
    'aria-describedby': describedBy,
    className: cn('field', multiline && 'min-h-28 resize-y'),
  };
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {multiline ? (
        <textarea {...shared} rows={4} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...shared} type={type} inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && (
        <p id={describedBy} role="alert" className="mt-2 text-[13px] text-[#ff8a8a]">
          {error}
        </p>
      )}
    </div>
  );
}
