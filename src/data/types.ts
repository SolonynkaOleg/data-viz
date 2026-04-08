/* ──────────────────────────────────────────────
   Core data types for the visualization project
   ────────────────────────────────────────────── */

/** A single country-year observation — the atomic unit of the dataset */
export interface CountryYearRecord {
  country: string;
  iso3: string;
  year: number;
  population: number;
  gdp_per_capita: number;
  life_expectancy: number;
  democracy_score: number;       // 0–1 continuous (V-Dem liberal democracy index)
  regime_type: RegimeType;
  conflict_deaths: number;
  conflict_events: number;
  latitude: number;
  longitude: number;
}

/** Discrete regime classification */
export type RegimeType =
  | 'Full democracy'
  | 'Flawed democracy'
  | 'Hybrid regime'
  | 'Autocracy';

/** Conflict event record (simplified UCDP-GED style) */
export interface ConflictEvent {
  id: number;
  country: string;
  iso3: string;
  year: number;
  latitude: number;
  longitude: number;
  deaths: number;
  type: string;
}

/** Regime transition record for Sankey-style charts */
export interface RegimeTransition {
  country: string;
  iso3: string;
  yearFrom: number;
  yearTo: number;
  regimeFrom: RegimeType;
  regimeTo: RegimeType;
}

/** Derived series for line charts (democracy over time) */
export interface DemocracySeries {
  country: string;
  iso3: string;
  values: { year: number; score: number }[];
}

/** Country metadata for lookups */
export interface CountryMeta {
  country: string;
  iso3: string;
  latitude: number;
  longitude: number;
  region: string;
}

/** Story step descriptor — drives the scrollytelling */
export interface StoryStep {
  id: string;
  section: SectionId;
  title: string;
  text: string;
  chartState: Partial<ChartState>;
}

/** Identifiers for the major sections */
export type SectionId =
  | 'intro'
  | 'global-overview'
  | 'democratic-backsliding'
  | 'regime-change'
  | 'conflict'
  | 'conclusion';

/** Describes what a chart should currently display */
export interface ChartState {
  activeSection: SectionId;
  year: number;
  yearRange: [number, number];
  selectedCountries: string[];   // iso3 codes
  highlightRegion: string | null;
  animating: boolean;
  transitionYears: [number, number]; // for Sankey: e.g. [2000, 2020]
}

/** Chart module interface — every chart must implement this */
export interface ChartModule {
  init(container: HTMLElement): void;
  update(state: ChartState, data: CountryYearRecord[]): void;
  resize(): void;
  destroy(): void;
}

/** Region grouping for filtering */
export type Region =
  | 'Europe'
  | 'Asia'
  | 'Africa'
  | 'Americas'
  | 'Oceania'
  | 'Middle East';
