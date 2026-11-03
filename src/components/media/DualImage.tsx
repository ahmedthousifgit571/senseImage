'use client';

import Image from 'next/image';
import { useMissionMode } from '@/components/providers/MissionMode';
import { cn } from '@/lib/util';

type Props = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  quality?: 75 | 90;
};

/**
 * A photo and its pre-rendered EO/IR twin (scripts/make-night.mjs), stacked.
 * The twin mounts once night mode is primed and fades in under html[data-mode=night].
 */
export default function DualImage({ src, alt, sizes, className, imgClassName, eager, quality = 75 }: Props) {
  const { nightReady } = useMissionMode();
  const night = src.replace(/\.webp$/, '.night.webp');
  return (
    <div className={cn('relative', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        className={cn(imgClassName, 'dual-day')}
      />
      {nightReady && <Image src={night} alt="" aria-hidden fill sizes={sizes} quality={quality} className={cn(imgClassName, 'dual-night')} />}
    </div>
  );
}
