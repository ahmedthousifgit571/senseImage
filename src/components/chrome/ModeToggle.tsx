'use client';

import { useRef } from 'react';
import { originOf, useMissionMode, type Mode } from '@/components/providers/MissionMode';
import { cn } from '@/lib/util';

const OPTIONS: { mode: Mode; label: string; sub: string }[] = [
  { mode: 'day', label: 'By day', sub: 'Optical' },
  { mode: 'night', label: 'By night', sub: 'EO-IR' },
];

/** `[ BY DAY // OPTICAL ] ——— [ BY NIGHT // EO-IR ]`, as a two-option radio group. */
export function ModeSwitch({ className }: { className?: string }) {
  const { mode, prime, switchTo } = useMissionMode();
  const group = useRef<HTMLDivElement>(null);

  const onKey = (e: React.KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next: Mode = mode === 'day' ? 'night' : 'day';
    const btn = group.current?.querySelector<HTMLButtonElement>(`[data-mode-option=${next}]`);
    btn?.focus();
    switchTo(next, originOf(btn ?? null));
  };

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label="Lighting mode"
      onKeyDown={onKey}
      onPointerEnter={prime}
      onFocus={prime}
      className={cn('flex items-center gap-3 sm:gap-5', className)}
    >
      {OPTIONS.map((o, i) => {
        const on = mode === o.mode;
        return (
          <div key={o.mode} className={cn('flex items-center gap-3 sm:gap-5', i === 1 && 'flex-row-reverse')}>
            <button
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              data-mode-option={o.mode}
              onClick={(e) => switchTo(o.mode, originOf(e.currentTarget))}
              className={cn('label flex min-h-11 items-center gap-1.5 px-1 text-[10px] font-bold whitespace-nowrap transition-opacity duration-300 sm:text-[11px]', on ? 'opacity-100' : 'opacity-70 hover:opacity-100')}
            >
              <span aria-hidden className="opacity-60">
                [
              </span>
              <span>{o.label}</span>
              <span aria-hidden className="opacity-50">
                {'//'}
              </span>
              <span className={cn(on && 'text-signal')}>{o.sub}</span>
              <span aria-hidden className="opacity-60">
                ]
              </span>
            </button>
            {i === 0 && (
              <span aria-hidden className="relative block h-px w-8 bg-current/40 sm:w-20">
                <span className="absolute top-1/2 left-0 size-[7px] -translate-y-1/2 rounded-full bg-signal shadow-[0_0_12px_2px_var(--signal)] transition-[left] duration-700 ease-expo night:left-[calc(100%-7px)]" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
