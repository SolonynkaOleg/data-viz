/* ──────────────────────────────────────────────
   Color palette — editorial, muted, serious
   ────────────────────────────────────────────── */

import type { RegimeType } from '../data/types';

/** Regime-type color mapping */
export const REGIME_COLORS: Record<RegimeType, string> = {
  'Full democracy':    '#2a7f62',
  'Flawed democracy':  '#6db598',
  'Hybrid regime':     '#e2a148',
  'Autocracy':         '#c0392b',
};

/** Ordered regime types for legends and Sankey nodes */
export const REGIME_ORDER: RegimeType[] = [
  'Full democracy',
  'Flawed democracy',
  'Hybrid regime',
  'Autocracy',
];

/** Accent palette for highlighting */
export const ACCENT = {
  primary:   '#1d3557',
  secondary: '#457b9d',
  highlight: '#e63946',
  muted:     '#a8dadc',
  light:     '#f1faee',
};

/** Neutral grays */
export const GRAY = {
  900: '#1a1a2e',
  800: '#2d2d44',
  700: '#3d3d56',
  600: '#5c5c72',
  500: '#8d8d9b',
  400: '#b0b0bc',
  300: '#d1d1da',
  200: '#e8e8ee',
  100: '#f4f4f7',
  50:  '#fafafe',
};

/** Sequential color scale for democracy score (0 → 1) */
export const DEMOCRACY_GRADIENT = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2a7f62'];

/** Conflict intensity color scale */
export const CONFLICT_GRADIENT = ['#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33', '#b30000'];

/** Region colors */
export const REGION_COLORS: Record<string, string> = {
  Europe:        '#457b9d',
  Asia:          '#2a7f62',
  Africa:        '#e2a148',
  Americas:      '#6c5ce7',
  Oceania:       '#00b894',
  'Middle East': '#d35400',
};
