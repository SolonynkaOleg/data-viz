/* ──────────────────────────────────────────────
   Story configuration — each step maps to a
   scroll position and a chart-state change
   ────────────────────────────────────────────── */

import type { StoryStep } from '../data/types';

export const STORY_STEPS: StoryStep[] = [
  /* ── Intro ─────────────────────────────────── */
  {
    id: 'intro-1',
    section: 'intro',
    title: '',
    text: '',
    chartState: { activeSection: 'intro', year: 2024 },
  },

  /* ── Section 1: Global Overview ────────────── */
  {
    id: 'overview-1',
    section: 'global-overview',
    title: 'Wealth and Health',
    text: `Let's begin with the classic lens: how does national wealth relate to life expectancy? Each bubble represents a country, sized by population and colored by regime type.`,
    chartState: { activeSection: 'global-overview', year: 1990, animating: false },
  },
  {
    id: 'overview-2',
    section: 'global-overview',
    title: 'Two Decades Later',
    text: `By 2022, most countries have shifted rightward — economies grew. But the gap between democracies and autocracies persists.`,
    chartState: { activeSection: 'global-overview', year: 2022, animating: false },
  },
  {
    id: 'overview-3',
    section: 'global-overview',
    title: 'Watch the Animation',
    text: `Here the chart animates through time, year by year. Notice how clusters form and shift — growth is uneven, and crises leave marks.`,
    chartState: { activeSection: 'global-overview', year: 1990, animating: true },
  },

  /* ── Section 2: Democratic Backsliding ─────── */
  {
    id: 'backsliding-1',
    section: 'democratic-backsliding',
    title: "The Third Wave's Retreat",
    text: `After the optimism of the 1990s, many analysts have documented democratic backsliding. These line charts show the democracy score trajectory for selected countries.`,
    chartState: {
      activeSection: 'democratic-backsliding',
      year: 2024,
      selectedCountries: ['USA', 'TUR', 'HUN', 'BRA', 'IND', 'POL'],
    },
  },
  {
    id: 'backsliding-2',
    section: 'democratic-backsliding',
    title: 'Erosion in Europe',
    text: `Hungary and Poland stand out as cases where democratic institutions were weakened from within — elected leaders dismantling checks and balances.`,
    chartState: {
      activeSection: 'democratic-backsliding',
      year: 2024,
      selectedCountries: ['HUN', 'POL', 'DEU', 'FRA'],
      highlightRegion: 'Europe',
    },
  },
  {
    id: 'backsliding-3',
    section: 'democratic-backsliding',
    title: 'Meanwhile in Asia',
    text: `India, once celebrated as the world's largest democracy, has seen a noticeable decline in its liberal-democracy index since the mid-2010s.`,
    chartState: {
      activeSection: 'democratic-backsliding',
      year: 2024,
      selectedCountries: ['IND', 'JPN', 'KOR', 'THA', 'MMR'],
      highlightRegion: 'Asia',
    },
  },

  /* ── Section 3: Regime Change ──────────────── */
  {
    id: 'regime-1',
    section: 'regime-change',
    title: 'The 1990s Transition',
    text: `Looking at the 1990–2000 period reveals a wave of democratization: many autocracies opened up after the Cold War. The flow was strongly toward democracy.`,
    chartState: {
      activeSection: 'regime-change',
      year: 2000,
      transitionYears: [1990, 2000],
    },
  },
  {
    id: 'regime-2',
    section: 'regime-change',
    title: 'Shifting Categories',
    text: `Fast-forward to 2000–2024: countries don't just slide on a spectrum — some cross categorical thresholds. This diagram shows how many countries moved between regime categories over the last two decades.`,
    chartState: {
      activeSection: 'regime-change',
      year: 2024,
      transitionYears: [2000, 2024],
    },
  },

  /* ── Section 4: Conflict ───────────────────── */
  {
    id: 'conflict-1',
    section: 'conflict',
    title: 'The Geography of Violence',
    text: `Armed conflict is not randomly distributed. This map shows the cumulative intensity of organized violence — darker shading means more fatalities.`,
    chartState: {
      activeSection: 'conflict',
      year: 2024,
      yearRange: [1990, 2024],
    },
  },
  {
    id: 'conflict-2',
    section: 'conflict',
    title: 'Recent Hotspots',
    text: `Zooming into the 2015–2024 window highlights Syria, Yemen, Ethiopia, Myanmar, and Ukraine — each devastating in different ways.`,
    chartState: {
      activeSection: 'conflict',
      year: 2024,
      yearRange: [2015, 2024],
    },
  },

  /* ── Conclusion ────────────────────────────── */
  {
    id: 'conclusion-1',
    section: 'conclusion',
    title: '',
    text: '',
    chartState: { activeSection: 'conclusion', year: 2024 },
  },
];
