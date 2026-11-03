'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { registerBay, unregisterBay, type Pose } from '@/lib/flight';
import { cn } from '@/lib/util';

type Props = {
  id: string;
  /** Initial pose; sections animate it later through setPose. */
  pose?: Partial<Pose>;
  clip?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Shown only when WebGL is unavailable, so the layout never sits empty. */
  fallback?: boolean;
  /** Above the fold: the fallback is the page's largest paint until the drone layer takes over. */
  eager?: boolean;
  children?: React.ReactNode;
};

/**
 * An empty area of the layout reserved for the drone. The WebGL layer finds it every frame, flies
 * the IndraKavach into it and sizes it to fit, so text in neighbouring grid areas is never covered.
 */
export default function DroneBay({ id, pose, clip = false, className, style, fallback = true, eager = false, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const initial = useRef(pose);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerBay(id, el, initial.current ?? {}, clip);
    return () => unregisterBay(id, el);
  }, [id, clip]);

  return (
    <div ref={ref} data-bay={id} aria-hidden className={cn('relative', className)} style={style}>
      {fallback && (
        <Image
          src="/media/hero/indrakavach.webp"
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 50vw"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          className="bay-fallback object-contain p-[6%] drop-shadow-[0_30px_40px_rgb(9_21_38/0.35)]"
        />
      )}
      {children}
    </div>
  );
}
