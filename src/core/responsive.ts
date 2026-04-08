/* ──────────────────────────────────────────────
   Responsive helpers — debounced resize handling
   ────────────────────────────────────────────── */

import { eventBus } from './eventBus';

let resizeTimer: ReturnType<typeof setTimeout> | null = null;

export function initResponsive(): void {
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      eventBus.emit('resize');
    }, 200);
  });
}

export function isMobile(): boolean {
  return window.innerWidth < 768;
}

export function isTablet(): boolean {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}
