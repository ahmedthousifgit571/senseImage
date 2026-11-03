export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

// The preloader announces when the curtain has lifted, so the hero can run its entrance.
let introDone = false;
const introListeners = new Set<() => void>();

export function markIntroDone() {
  introDone = true;
  introListeners.forEach((fn) => fn());
  introListeners.clear();
}

export function onIntroDone(fn: () => void) {
  if (introDone) {
    fn();
    return () => {};
  }
  introListeners.add(fn);
  return () => introListeners.delete(fn);
}

// The spec-sheet drawer can be opened from anywhere on the page.
export const SPEC_OPEN = 'si:spec-open';
export const openSpecDrawer = () => window.dispatchEvent(new Event(SPEC_OPEN));
