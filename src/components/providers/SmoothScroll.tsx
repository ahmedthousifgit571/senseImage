'use client';

import { useEffect, useRef } from 'react';
import { ReactLenis, useLenis, type LenisRef } from 'lenis/react';
import { gsap, MOTION_OK, ScrollTrigger } from '@/lib/gsap';

function ScrollTriggerBridge() {
  useLenis(ScrollTrigger.update);
  return null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const tick = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Web fonts and late images change layout, which moves every trigger below the fold.
    let cancelled = false;
    const refresh = () => !cancelled && ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh, { once: true });

    return () => {
      cancelled = true;
      gsap.ticker.remove(tick);
      window.removeEventListener('load', refresh);
    };
  }, []);

  // Lenis only reads these options inside an effect, so this never reaches the markup.
  const smoothWheel = typeof window === 'undefined' || window.matchMedia(MOTION_OK).matches;

  return (
    <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1, smoothWheel, anchors: true }}>
      <ScrollTriggerBridge />
      {children}
    </ReactLenis>
  );
}
