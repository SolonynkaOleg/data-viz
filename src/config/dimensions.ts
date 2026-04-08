/* ──────────────────────────────────────────────
   Chart dimension defaults and responsive helpers
   ────────────────────────────────────────────── */

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Dimensions {
  width: number;
  height: number;
  margin: Margin;
  boundedWidth: number;
  boundedHeight: number;
}

const DEFAULT_MARGIN: Margin = { top: 40, right: 30, bottom: 50, left: 60 };

/** Compute dimensions from a container element */
export function getDimensions(
  container: HTMLElement,
  margin: Margin = DEFAULT_MARGIN,
): Dimensions {
  const rect = container.getBoundingClientRect();
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);
  return {
    width,
    height,
    margin,
    boundedWidth: Math.max(0, width - margin.left - margin.right),
    boundedHeight: Math.max(0, height - margin.top - margin.bottom),
  };
}

/** Standard chart margins for different chart types */
const DESKTOP_MARGINS: Record<string, Margin> = {
  scatter:  { top: 40, right: 30, bottom: 50, left: 70 },
  line:     { top: 30, right: 120, bottom: 50, left: 60 },
  sankey:   { top: 20, right: 20, bottom: 20, left: 20 },
  map:      { top: 10, right: 10, bottom: 10, left: 10 },
};

const MOBILE_MARGINS: Record<string, Margin> = {
  scatter:  { top: 24, right: 12, bottom: 38, left: 42 },
  line:     { top: 20, right: 50, bottom: 38, left: 38 },
  sankey:   { top: 16, right: 8, bottom: 16, left: 8 },
  map:      { top: 6, right: 6, bottom: 6, left: 6 },
};

/** Returns correct margins based on screen width */
export const CHART_MARGINS: Record<string, Margin> = new Proxy({} as Record<string, Margin>, {
  get(_target, prop: string) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
    return (isMobile ? MOBILE_MARGINS : DESKTOP_MARGINS)[prop] ?? DEFAULT_MARGIN;
  },
});

/** Year range for the dataset */
export const YEAR_RANGE: [number, number] = [1990, 2024];

/** Animation durations (ms) */
export const TRANSITION = {
  fast:    200,
  normal:  500,
  slow:    800,
  reveal: 1200,
};

/** Breakpoints */
export const BREAKPOINT = {
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};
