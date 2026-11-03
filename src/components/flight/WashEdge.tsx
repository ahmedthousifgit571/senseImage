'use client';

import { useEffect, useRef } from 'react';
import { registerWash } from '@/lib/flight';

/**
 * Marks the top edge of a section: as it rises through the screen, a cloud bank rolls over the page
 * with it. `tone` matches the cloud to the section it leads into.
 */
export default function WashEdge({ tone = 'paper' }: { tone?: 'paper' | 'wash' }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => (ref.current ? registerWash(ref.current) : undefined), []);
  return <span ref={ref} aria-hidden data-tone={tone} className="pointer-events-none absolute inset-x-0 top-0 block h-px" />;
}
