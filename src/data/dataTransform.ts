/* ──────────────────────────────────────────────
   Data transformation utilities
   Derive chart-specific data from the master set
   ────────────────────────────────────────────── */

import type {
  CountryYearRecord,
  DemocracySeries,
  RegimeTransition,
  RegimeType,
} from './types';
import { classifyRegime } from './mockData';

/** Filter records to a single year */
export function filterByYear(data: CountryYearRecord[], year: number): CountryYearRecord[] {
  return data.filter(d => d.year === year);
}

/** Filter records to a year range [start, end] inclusive */
export function filterByYearRange(
  data: CountryYearRecord[],
  start: number,
  end: number,
): CountryYearRecord[] {
  return data.filter(d => d.year >= start && d.year <= end);
}

/** Filter to specific countries (by iso3) */
export function filterByCountries(
  data: CountryYearRecord[],
  iso3List: string[],
): CountryYearRecord[] {
  const set = new Set(iso3List);
  return data.filter(d => set.has(d.iso3));
}

/** Build democracy time-series for selected countries */
export function buildDemocracySeries(
  data: CountryYearRecord[],
  iso3List: string[],
): DemocracySeries[] {
  const filtered = filterByCountries(data, iso3List);
  const grouped = new Map<string, { country: string; values: { year: number; score: number }[] }>();

  for (const r of filtered) {
    if (!grouped.has(r.iso3)) {
      grouped.set(r.iso3, { country: r.country, values: [] });
    }
    grouped.get(r.iso3)!.values.push({ year: r.year, score: r.democracy_score });
  }

  return Array.from(grouped.entries()).map(([iso3, v]) => ({
    country: v.country,
    iso3,
    values: v.values.sort((a, b) => a.year - b.year),
  }));
}

/** Build regime transition data between two years */
export function buildRegimeTransitions(
  data: CountryYearRecord[],
  yearFrom: number,
  yearTo: number,
): RegimeTransition[] {
  const byCountry = new Map<string, Map<number, CountryYearRecord>>();
  for (const r of data) {
    if (!byCountry.has(r.iso3)) byCountry.set(r.iso3, new Map());
    byCountry.get(r.iso3)!.set(r.year, r);
  }

  const transitions: RegimeTransition[] = [];
  for (const [iso3, years] of byCountry) {
    const from = years.get(yearFrom);
    const to = years.get(yearTo);
    if (from && to) {
      transitions.push({
        country: from.country,
        iso3,
        yearFrom,
        yearTo,
        regimeFrom: from.regime_type,
        regimeTo: to.regime_type,
      });
    }
  }
  return transitions;
}

/** Aggregate conflict data by country for a year range */
export function aggregateConflictByCountry(
  data: CountryYearRecord[],
  startYear: number,
  endYear: number,
): Map<string, { deaths: number; events: number; country: string }> {
  const result = new Map<string, { deaths: number; events: number; country: string }>();
  for (const r of data) {
    if (r.year < startYear || r.year > endYear) continue;
    if (!result.has(r.iso3)) {
      result.set(r.iso3, { deaths: 0, events: 0, country: r.country });
    }
    const agg = result.get(r.iso3)!;
    agg.deaths += r.conflict_deaths;
    agg.events += r.conflict_events;
  }
  return result;
}

/** Get unique sorted years from the dataset */
export function getYears(data: CountryYearRecord[]): number[] {
  return [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
}

/** Get unique countries */
export function getCountryList(data: CountryYearRecord[]): { country: string; iso3: string }[] {
  const seen = new Set<string>();
  const list: { country: string; iso3: string }[] = [];
  for (const r of data) {
    if (!seen.has(r.iso3)) {
      seen.add(r.iso3);
      list.push({ country: r.country, iso3: r.iso3 });
    }
  }
  return list.sort((a, b) => a.country.localeCompare(b.country));
}

/** Count countries per regime type for a given year */
export function regimeCounts(
  data: CountryYearRecord[],
  year: number,
): Map<RegimeType, number> {
  const counts = new Map<RegimeType, number>();
  for (const r of filterByYear(data, year)) {
    counts.set(r.regime_type, (counts.get(r.regime_type) ?? 0) + 1);
  }
  return counts;
}
