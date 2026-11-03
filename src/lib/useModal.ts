'use client';

import { useEffect, type RefObject } from 'react';
import { useLenis } from 'lenis/react';

/** Modal plumbing shared by the menu and drawers: pause smooth scroll, Esc to close, trap Tab, restore focus. */
export function useModal(open: boolean, onClose: () => void, panel: RefObject<HTMLElement | null>) {
  const lenis = useLenis();

  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const previous = document.activeElement as HTMLElement | null;
    const el = panel.current;
    el?.querySelector<HTMLElement>('[data-first]')?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const focusable = [...el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select, [tabindex="0"]')].filter(
        (node) => node.offsetParent !== null,
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      lenis?.start();
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, lenis, onClose, panel]);

  return lenis;
}
