/* ──────────────────────────────────────────────
   Mock dataset generator
   Produces realistic-looking country-year data
   for 40 countries × 33 years (1990–2022).
   Replace with real CSV/JSON later via dataLoader.
   ────────────────────────────────────────────── */

import type { CountryYearRecord, RegimeType, ConflictEvent, CountryMeta } from './types';

/* ── Country seed data ───────────────────────── */

interface CountrySeed {
  country: string;
  iso3: string;
  region: string;
  lat: number;
  lng: number;
  pop1990: number;      // millions
  popGrowth: number;    // annual %
  gdp1990: number;      // PPP per capita
  gdpGrowth: number;    // annual %
  le1990: number;       // life expectancy
  leGrowth: number;     // annual increase
  dem1990: number;      // democracy score 0–1
  demTrend: number;     // annual drift
  demShockYear?: number;
  demShockSize?: number;
  conflictBase: number; // avg annual conflict deaths
}

const seeds: CountrySeed[] = [
  { country: 'United States',  iso3: 'USA', region: 'Americas',     lat: 38, lng: -97,  pop1990: 249, popGrowth: 0.9,  gdp1990: 23300, gdpGrowth: 1.8, le1990: 75.2, leGrowth: 0.18, dem1990: 0.87, demTrend: -0.002, demShockYear: 2017, demShockSize: -0.04, conflictBase: 5 },
  { country: 'Brazil',         iso3: 'BRA', region: 'Americas',     lat: -14, lng: -51, pop1990: 150, popGrowth: 1.1,  gdp1990: 6800,  gdpGrowth: 1.5, le1990: 65.3, leGrowth: 0.30, dem1990: 0.55, demTrend: 0.008,  demShockYear: 2019, demShockSize: -0.06, conflictBase: 30 },
  { country: 'Mexico',         iso3: 'MEX', region: 'Americas',     lat: 23, lng: -102, pop1990: 83,  popGrowth: 1.3,  gdp1990: 7500,  gdpGrowth: 1.2, le1990: 70.8, leGrowth: 0.22, dem1990: 0.35, demTrend: 0.012,  conflictBase: 80 },
  { country: 'Argentina',      iso3: 'ARG', region: 'Americas',     lat: -38, lng: -63, pop1990: 32,  popGrowth: 1.0,  gdp1990: 8200,  gdpGrowth: 1.0, le1990: 71.0, leGrowth: 0.20, dem1990: 0.62, demTrend: 0.004,  conflictBase: 2 },
  { country: 'Germany',        iso3: 'DEU', region: 'Europe',       lat: 51, lng: 10,   pop1990: 80,  popGrowth: 0.1,  gdp1990: 20000, gdpGrowth: 1.4, le1990: 75.4, leGrowth: 0.22, dem1990: 0.90, demTrend: 0.001,  conflictBase: 0 },
  { country: 'France',         iso3: 'FRA', region: 'Europe',       lat: 46, lng: 2,    pop1990: 58,  popGrowth: 0.4,  gdp1990: 19500, gdpGrowth: 1.2, le1990: 76.9, leGrowth: 0.24, dem1990: 0.88, demTrend: 0.001,  conflictBase: 1 },
  { country: 'United Kingdom', iso3: 'GBR', region: 'Europe',       lat: 55, lng: -3,   pop1990: 57,  popGrowth: 0.5,  gdp1990: 18000, gdpGrowth: 1.5, le1990: 75.7, leGrowth: 0.25, dem1990: 0.89, demTrend: 0.0,    conflictBase: 1 },
  { country: 'Poland',         iso3: 'POL', region: 'Europe',       lat: 52, lng: 20,   pop1990: 38,  popGrowth: 0.0,  gdp1990: 5400,  gdpGrowth: 3.5, le1990: 70.8, leGrowth: 0.22, dem1990: 0.55, demTrend: 0.010,  demShockYear: 2015, demShockSize: -0.05, conflictBase: 0 },
  { country: 'Hungary',        iso3: 'HUN', region: 'Europe',       lat: 47, lng: 20,   pop1990: 10,  popGrowth: -0.2, gdp1990: 6200,  gdpGrowth: 2.5, le1990: 69.3, leGrowth: 0.20, dem1990: 0.60, demTrend: 0.012,  demShockYear: 2010, demShockSize: -0.08, conflictBase: 0 },
  { country: 'Turkey',         iso3: 'TUR', region: 'Middle East',  lat: 39, lng: 35,   pop1990: 54,  popGrowth: 1.5,  gdp1990: 5800,  gdpGrowth: 2.5, le1990: 64.3, leGrowth: 0.35, dem1990: 0.40, demTrend: 0.008,  demShockYear: 2013, demShockSize: -0.10, conflictBase: 120 },
  { country: 'Russia',         iso3: 'RUS', region: 'Europe',       lat: 62, lng: 105,  pop1990: 148, popGrowth: -0.1, gdp1990: 7600,  gdpGrowth: 1.0, le1990: 69.2, leGrowth: 0.08, dem1990: 0.42, demTrend: -0.005, conflictBase: 200 },
  { country: 'China',          iso3: 'CHN', region: 'Asia',         lat: 35, lng: 105,  pop1990: 1135, popGrowth: 0.6, gdp1990: 1500,  gdpGrowth: 7.5, le1990: 69.3, leGrowth: 0.28, dem1990: 0.08, demTrend: 0.0,    conflictBase: 10 },
  { country: 'India',          iso3: 'IND', region: 'Asia',         lat: 21, lng: 78,   pop1990: 873, popGrowth: 1.5,  gdp1990: 1200,  gdpGrowth: 4.5, le1990: 58.5, leGrowth: 0.38, dem1990: 0.62, demTrend: 0.003,  demShockYear: 2014, demShockSize: -0.06, conflictBase: 350 },
  { country: 'Japan',          iso3: 'JPN', region: 'Asia',         lat: 36, lng: 138,  pop1990: 124, popGrowth: 0.1,  gdp1990: 24000, gdpGrowth: 0.8, le1990: 78.8, leGrowth: 0.20, dem1990: 0.85, demTrend: 0.001,  conflictBase: 0 },
  { country: 'South Korea',    iso3: 'KOR', region: 'Asia',         lat: 37, lng: 128,  pop1990: 43,  popGrowth: 0.5,  gdp1990: 8000,  gdpGrowth: 4.0, le1990: 71.3, leGrowth: 0.30, dem1990: 0.65, demTrend: 0.008,  conflictBase: 0 },
  { country: 'Thailand',       iso3: 'THA', region: 'Asia',         lat: 15, lng: 101,  pop1990: 56,  popGrowth: 0.7,  gdp1990: 4200,  gdpGrowth: 3.0, le1990: 68.0, leGrowth: 0.25, dem1990: 0.38, demTrend: 0.005,  demShockYear: 2014, demShockSize: -0.08, conflictBase: 40 },
  { country: 'Myanmar',        iso3: 'MMR', region: 'Asia',         lat: 22, lng: 96,   pop1990: 41,  popGrowth: 1.0,  gdp1990: 600,   gdpGrowth: 5.0, le1990: 56.0, leGrowth: 0.30, dem1990: 0.05, demTrend: 0.005,  demShockYear: 2021, demShockSize: -0.15, conflictBase: 200 },
  { country: 'Indonesia',      iso3: 'IDN', region: 'Asia',         lat: -5, lng: 120,  pop1990: 181, popGrowth: 1.3,  gdp1990: 2400,  gdpGrowth: 3.5, le1990: 62.5, leGrowth: 0.28, dem1990: 0.15, demTrend: 0.015,  conflictBase: 50 },
  { country: 'Nigeria',        iso3: 'NGA', region: 'Africa',       lat: 10, lng: 8,    pop1990: 96,  popGrowth: 2.6,  gdp1990: 1400,  gdpGrowth: 2.5, le1990: 46.0, leGrowth: 0.30, dem1990: 0.10, demTrend: 0.008,  conflictBase: 300 },
  { country: 'South Africa',   iso3: 'ZAF', region: 'Africa',       lat: -30, lng: 26,  pop1990: 37,  popGrowth: 1.5,  gdp1990: 5800,  gdpGrowth: 1.2, le1990: 62.0, leGrowth: -0.1, dem1990: 0.25, demTrend: 0.018,  conflictBase: 40 },
  { country: 'Kenya',          iso3: 'KEN', region: 'Africa',       lat: 0, lng: 38,    pop1990: 23,  popGrowth: 2.5,  gdp1990: 1100,  gdpGrowth: 1.5, le1990: 59.0, leGrowth: 0.15, dem1990: 0.18, demTrend: 0.010,  conflictBase: 30 },
  { country: 'Ethiopia',       iso3: 'ETH', region: 'Africa',       lat: 9, lng: 40,    pop1990: 48,  popGrowth: 2.8,  gdp1990: 450,   gdpGrowth: 4.0, le1990: 46.0, leGrowth: 0.42, dem1990: 0.08, demTrend: 0.005,  demShockYear: 2020, demShockSize: -0.05, conflictBase: 500 },
  { country: 'DR Congo',       iso3: 'COD', region: 'Africa',       lat: -4, lng: 22,   pop1990: 35,  popGrowth: 3.0,  gdp1990: 600,   gdpGrowth: 0.5, le1990: 47.0, leGrowth: 0.25, dem1990: 0.05, demTrend: 0.003,  conflictBase: 800 },
  { country: 'Egypt',          iso3: 'EGY', region: 'Middle East',  lat: 26, lng: 30,   pop1990: 57,  popGrowth: 1.8,  gdp1990: 3200,  gdpGrowth: 2.0, le1990: 63.3, leGrowth: 0.28, dem1990: 0.15, demTrend: 0.002,  demShockYear: 2013, demShockSize: -0.04, conflictBase: 50 },
  { country: 'Iran',           iso3: 'IRN', region: 'Middle East',  lat: 32, lng: 53,   pop1990: 56,  popGrowth: 1.2,  gdp1990: 4500,  gdpGrowth: 1.5, le1990: 63.0, leGrowth: 0.30, dem1990: 0.12, demTrend: 0.002,  conflictBase: 30 },
  { country: 'Saudi Arabia',   iso3: 'SAU', region: 'Middle East',  lat: 24, lng: 45,   pop1990: 16,  popGrowth: 2.5,  gdp1990: 15000, gdpGrowth: 0.8, le1990: 68.0, leGrowth: 0.25, dem1990: 0.02, demTrend: 0.001,  conflictBase: 2 },
  { country: 'Iraq',           iso3: 'IRQ', region: 'Middle East',  lat: 33, lng: 44,   pop1990: 18,  popGrowth: 2.5,  gdp1990: 3000,  gdpGrowth: 0.5, le1990: 65.0, leGrowth: 0.10, dem1990: 0.05, demTrend: 0.004,  conflictBase: 2000 },
  { country: 'Syria',          iso3: 'SYR', region: 'Middle East',  lat: 35, lng: 38,   pop1990: 12,  popGrowth: 2.0,  gdp1990: 2600,  gdpGrowth: 0.5, le1990: 68.0, leGrowth: 0.10, dem1990: 0.05, demTrend: 0.0,    demShockYear: 2011, demShockSize: -0.03, conflictBase: 50 },
  { country: 'Yemen',          iso3: 'YEM', region: 'Middle East',  lat: 15, lng: 48,   pop1990: 12,  popGrowth: 3.0,  gdp1990: 1200,  gdpGrowth: 0.3, le1990: 54.0, leGrowth: 0.30, dem1990: 0.08, demTrend: 0.002,  demShockYear: 2015, demShockSize: -0.04, conflictBase: 400 },
  { country: 'Australia',      iso3: 'AUS', region: 'Oceania',      lat: -26, lng: 134, pop1990: 17,  popGrowth: 1.3,  gdp1990: 18000, gdpGrowth: 1.8, le1990: 77.0, leGrowth: 0.24, dem1990: 0.91, demTrend: 0.001,  conflictBase: 0 },
  { country: 'Canada',         iso3: 'CAN', region: 'Americas',     lat: 56, lng: -106, pop1990: 27,  popGrowth: 1.0,  gdp1990: 20000, gdpGrowth: 1.5, le1990: 77.4, leGrowth: 0.22, dem1990: 0.92, demTrend: 0.001,  conflictBase: 0 },
  { country: 'Sweden',         iso3: 'SWE', region: 'Europe',       lat: 62, lng: 15,   pop1990: 8.5, popGrowth: 0.6,  gdp1990: 21000, gdpGrowth: 1.5, le1990: 77.6, leGrowth: 0.22, dem1990: 0.93, demTrend: 0.001,  conflictBase: 0 },
  { country: 'Norway',         iso3: 'NOR', region: 'Europe',       lat: 60, lng: 8,    pop1990: 4.2, popGrowth: 0.7,  gdp1990: 24000, gdpGrowth: 1.3, le1990: 76.9, leGrowth: 0.22, dem1990: 0.94, demTrend: 0.001,  conflictBase: 0 },
  { country: 'Ukraine',        iso3: 'UKR', region: 'Europe',       lat: 49, lng: 32,   pop1990: 52,  popGrowth: -0.5, gdp1990: 5500,  gdpGrowth: 0.5, le1990: 70.0, leGrowth: 0.05, dem1990: 0.42, demTrend: 0.006,  demShockYear: 2014, demShockSize: -0.03, conflictBase: 50 },
  { country: 'Venezuela',      iso3: 'VEN', region: 'Americas',     lat: 7, lng: -66,   pop1990: 20,  popGrowth: 1.5,  gdp1990: 8500,  gdpGrowth: -0.5, le1990: 71.0, leGrowth: 0.12, dem1990: 0.62, demTrend: -0.010, conflictBase: 30 },
  { country: 'Colombia',       iso3: 'COL', region: 'Americas',     lat: 4, lng: -72,   pop1990: 33,  popGrowth: 1.2,  gdp1990: 4800,  gdpGrowth: 2.0, le1990: 68.0, leGrowth: 0.28, dem1990: 0.50, demTrend: 0.006,  conflictBase: 400 },
  { country: 'Philippines',    iso3: 'PHL', region: 'Asia',         lat: 13, lng: 122,  pop1990: 61,  popGrowth: 1.8,  gdp1990: 2400,  gdpGrowth: 2.5, le1990: 65.0, leGrowth: 0.22, dem1990: 0.48, demTrend: 0.005,  demShockYear: 2016, demShockSize: -0.06, conflictBase: 100 },
  { country: 'Pakistan',       iso3: 'PAK', region: 'Asia',         lat: 30, lng: 70,   pop1990: 108, popGrowth: 2.2,  gdp1990: 1600,  gdpGrowth: 2.0, le1990: 60.0, leGrowth: 0.25, dem1990: 0.22, demTrend: 0.004,  conflictBase: 350 },
  { country: 'Bangladesh',     iso3: 'BGD', region: 'Asia',         lat: 24, lng: 90,   pop1990: 106, popGrowth: 1.5,  gdp1990: 800,   gdpGrowth: 4.0, le1990: 55.0, leGrowth: 0.40, dem1990: 0.30, demTrend: 0.005,  conflictBase: 20 },
  { country: 'Tanzania',       iso3: 'TZA', region: 'Africa',       lat: -6, lng: 35,   pop1990: 26,  popGrowth: 2.8,  gdp1990: 600,   gdpGrowth: 3.0, le1990: 50.0, leGrowth: 0.32, dem1990: 0.22, demTrend: 0.004,  conflictBase: 10 },
];

/* ── Deterministic seeded random ─────────────── */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── Classify regime type from score ─────────── */
export function classifyRegime(score: number): RegimeType {
  if (score >= 0.70) return 'Full democracy';
  if (score >= 0.50) return 'Flawed democracy';
  if (score >= 0.25) return 'Hybrid regime';
  return 'Autocracy';
}

/* ── Generate full dataset ───────────────────── */
export function generateMockData(): CountryYearRecord[] {
  const rand = seededRandom(42);
  const records: CountryYearRecord[] = [];

  for (const s of seeds) {
    let demScore = s.dem1990;

    for (let year = 1990; year <= 2022; year++) {
      const t = year - 1990;

      // Population
      const pop = s.pop1990 * Math.pow(1 + s.popGrowth / 100, t) * 1_000_000;

      // GDP per capita with some noise
      const gdpNoise = 1 + (rand() - 0.5) * 0.04;
      const gdp = s.gdp1990 * Math.pow(1 + s.gdpGrowth / 100, t) * gdpNoise;

      // Life expectancy
      const leNoise = (rand() - 0.5) * 0.6;
      let le = s.le1990 + s.leGrowth * t + leNoise;
      // COVID dip
      if (year === 2020 || year === 2021) le -= 0.8 + rand() * 0.8;
      le = Math.max(40, Math.min(86, le));

      // Democracy score with drift, shock, and noise
      demScore += s.demTrend + (rand() - 0.5) * 0.01;
      if (s.demShockYear && year === s.demShockYear) {
        demScore += s.demShockSize!;
      }
      demScore = Math.max(0.01, Math.min(0.99, demScore));

      // Conflict
      const conflictMult = s.iso3 === 'SYR' && year >= 2011 ? 40 :
                           s.iso3 === 'YEM' && year >= 2015 ? 20 :
                           s.iso3 === 'UKR' && year >= 2022 ? 30 :
                           s.iso3 === 'ETH' && year >= 2020 ? 15 :
                           s.iso3 === 'IRQ' && year >= 2003 && year <= 2011 ? 15 :
                           s.iso3 === 'MMR' && year >= 2021 ? 10 : 1;
      const deaths = Math.round(s.conflictBase * conflictMult * (0.5 + rand()));
      const events = Math.round(deaths / (3 + rand() * 10));

      records.push({
        country: s.country,
        iso3: s.iso3,
        year,
        population: Math.round(pop),
        gdp_per_capita: Math.round(gdp),
        life_expectancy: Math.round(le * 10) / 10,
        democracy_score: Math.round(demScore * 1000) / 1000,
        regime_type: classifyRegime(demScore),
        conflict_deaths: deaths,
        conflict_events: Math.max(0, events),
        latitude: s.lat,
        longitude: s.lng,
      });
    }
  }
  return records;
}

/** Generate standalone conflict events (for map dots) */
export function generateMockConflictEvents(): ConflictEvent[] {
  const rand = seededRandom(99);
  const events: ConflictEvent[] = [];
  let id = 1;

  const hotspots = [
    { iso3: 'SYR', country: 'Syria',     lat: 35, lng: 38, startYear: 2011 },
    { iso3: 'IRQ', country: 'Iraq',      lat: 33, lng: 44, startYear: 2003 },
    { iso3: 'YEM', country: 'Yemen',     lat: 15, lng: 48, startYear: 2015 },
    { iso3: 'ETH', country: 'Ethiopia',  lat: 9,  lng: 40, startYear: 2020 },
    { iso3: 'UKR', country: 'Ukraine',   lat: 49, lng: 32, startYear: 2022 },
    { iso3: 'COD', country: 'DR Congo',  lat: -4, lng: 22, startYear: 1996 },
    { iso3: 'NGA', country: 'Nigeria',   lat: 10, lng: 8,  startYear: 2009 },
    { iso3: 'MMR', country: 'Myanmar',   lat: 22, lng: 96, startYear: 2021 },
    { iso3: 'COL', country: 'Colombia',  lat: 4,  lng: -72, startYear: 1990 },
    { iso3: 'PAK', country: 'Pakistan',  lat: 30, lng: 70, startYear: 2001 },
  ];

  for (const h of hotspots) {
    for (let year = h.startYear; year <= 2022; year++) {
      const count = 3 + Math.floor(rand() * 8);
      for (let i = 0; i < count; i++) {
        events.push({
          id: id++,
          country: h.country,
          iso3: h.iso3,
          year,
          latitude: h.lat + (rand() - 0.5) * 4,
          longitude: h.lng + (rand() - 0.5) * 4,
          deaths: Math.round(1 + rand() * 200),
          type: rand() > 0.6 ? 'state-based' : rand() > 0.3 ? 'non-state' : 'one-sided',
        });
      }
    }
  }
  return events;
}

/** Get country metadata list */
export function getCountryMeta(): CountryMeta[] {
  return seeds.map(s => ({
    country: s.country,
    iso3: s.iso3,
    latitude: s.lat,
    longitude: s.lng,
    region: s.region,
  }));
}
