/* ──────────────────────────────────────────────
   Data loader — loads real CSVs from public/data/
   and merges them into the app's typed models.

   Files expected:
     public/data/owid.csv      → country, iso3, year, population, gdp
     public/data/life-exp.csv  → country, iso3, year, life_expectancy
     public/data/vdem.csv      → country, iso3, year, democracy_score
     public/data/ged-agg.csv   → country, year, deaths, events, latitude, longitude
     public/data/ged.csv       → id, country, year, latitude, longitude, deaths, type  (optional, for map dots)
   ────────────────────────────────────────────── */

import * as d3 from 'd3';
import type { CountryYearRecord, ConflictEvent, CountryMeta, RegimeType } from './types';
import { classifyRegime } from './mockData';

/* ── Country centroid lookup (approximate) ────── */
const COUNTRY_COORDS: Record<string, [number, number]> = {
  AFG:[33,65],ALB:[41,20],DZA:[28,3],AGO:[-12,17],ARG:[-34,-64],ARM:[40,45],AUS:[-27,133],AUT:[47,14],
  AZE:[41,48],BHR:[26,51],BGD:[24,90],BLR:[53,28],BEL:[51,4],BEN:[9,2],BTN:[28,90],BOL:[-17,-65],
  BIH:[44,18],BWA:[-22,24],BRA:[-10,-55],BRN:[4,115],BGR:[43,25],BFA:[13,-2],BDI:[-3,30],KHM:[13,105],
  CMR:[6,12],CAN:[60,-95],CPV:[16,-24],CAF:[7,21],TCD:[15,19],CHL:[-30,-71],CHN:[35,105],COL:[4,-72],
  COM:[-12,44],COD:[-4,22],COG:[-1,15],CRI:[10,-84],CIV:[8,-5],HRV:[45,16],CUB:[22,-80],CYP:[35,33],
  CZE:[50,16],DNK:[56,10],DJI:[12,43],DOM:[19,-70],ECU:[-2,-78],EGY:[27,30],SLV:[14,-89],GNQ:[2,10],
  ERI:[15,39],EST:[59,26],ETH:[9,39],FIN:[64,26],FRA:[46,2],GAB:[-1,12],GMB:[13,-17],GEO:[42,44],
  DEU:[51,10],GHA:[8,-1],GRC:[39,22],GTM:[16,-90],GIN:[11,-10],GNB:[12,-15],GUY:[5,-59],HTI:[19,-72],
  HND:[15,-87],HUN:[47,20],ISL:[65,-18],IND:[21,78],IDN:[-5,120],IRN:[32,53],IRQ:[33,44],IRL:[53,-8],
  ISR:[31,35],ITA:[43,12],JAM:[18,-77],JPN:[36,138],JOR:[31,36],KAZ:[48,68],KEN:[1,38],PRK:[40,127],
  KOR:[37,128],KWT:[29,48],KGZ:[41,75],LAO:[18,105],LVA:[57,25],LBN:[34,36],LSO:[-29,29],LBR:[7,-10],
  LBY:[27,17],LTU:[56,24],LUX:[50,6],MKD:[41,22],MDG:[-20,47],MWI:[-14,34],MYS:[3,102],MLI:[17,-4],
  MRT:[20,-12],MUS:[-20,58],MEX:[23,-102],MDA:[47,29],MNG:[48,107],MNE:[43,19],MAR:[32,-5],MOZ:[-18,35],
  MMR:[22,96],NAM:[-22,17],NPL:[28,84],NLD:[52,5],NZL:[-41,174],NIC:[13,-85],NER:[16,8],NGA:[10,8],
  NOR:[62,10],OMN:[21,58],PAK:[30,70],PAN:[9,-80],PNG:[-6,147],PRY:[-23,-58],PER:[-10,-76],PHL:[13,122],
  POL:[52,20],PRT:[40,-8],QAT:[25,51],ROU:[46,25],RUS:[62,105],RWA:[-2,30],SAU:[24,45],SEN:[14,-14],
  SRB:[44,21],SLE:[9,-12],SGP:[1,104],SVK:[49,20],SVN:[46,15],SOM:[5,46],ZAF:[-29,24],SSD:[7,30],
  ESP:[40,-4],LKA:[7,81],SDN:[13,30],SUR:[4,-56],SWZ:[-27,31],SWE:[62,15],CHE:[47,8],SYR:[35,38],
  TWN:[24,121],TJK:[39,71],TZA:[-6,35],THA:[15,101],TLS:[-9,126],TGO:[8,1],TTO:[11,-61],TUN:[34,9],
  TUR:[39,35],TKM:[39,60],UGA:[1,32],UKR:[49,32],ARE:[24,54],GBR:[54,-2],USA:[38,-97],URY:[-33,-56],
  UZB:[41,65],VEN:[8,-66],VNM:[14,108],YEM:[15,48],ZMB:[-15,28],ZWE:[-20,30],
  XKX:[43,21],PSE:[32,35],
};

/* ── GED country-name → iso3 mapping (common mismatches) ── */
const GED_COUNTRY_TO_ISO3: Record<string, string> = {
  'Afghanistan': 'AFG', 'Albania': 'ALB', 'Algeria': 'DZA', 'Angola': 'AGO',
  'Argentina': 'ARG', 'Armenia': 'ARM', 'Australia': 'AUS', 'Azerbaijan': 'AZE',
  'Bahrain': 'BHR', 'Bangladesh': 'BGD', 'Belarus': 'BLR', 'Benin': 'BEN',
  'Bolivia (Plurinational State of)': 'BOL', 'Bosnia-Herzegovina': 'BIH',
  'Burkina Faso': 'BFA', 'Burundi': 'BDI', 'Cambodia (Kampuchea)': 'KHM',
  'Cameroon': 'CMR', 'Central African Republic': 'CAF', 'Chad': 'TCD',
  'Chile': 'CHL', 'China': 'CHN', 'Colombia': 'COL',
  'Congo, DRC': 'COD', 'DR Congo (Zaire)': 'COD', 'Congo': 'COG',
  'Ivory Coast': 'CIV', "Cote d'Ivoire": 'CIV',
  'Croatia': 'HRV', 'Cuba': 'CUB', 'Cyprus': 'CYP',
  'Djibouti': 'DJI', 'Ecuador': 'ECU', 'Egypt': 'EGY',
  'El Salvador': 'SLV', 'Equatorial Guinea': 'GNQ', 'Eritrea': 'ERI',
  'Estonia': 'EST', 'Ethiopia': 'ETH', 'France': 'FRA', 'Gabon': 'GAB',
  'Gambia': 'GMB', 'Georgia': 'GEO', 'Germany': 'DEU', 'Ghana': 'GHA',
  'Greece': 'GRC', 'Guatemala': 'GTM', 'Guinea': 'GIN', 'Guinea-Bissau': 'GNB',
  'Haiti': 'HTI', 'Honduras': 'HND', 'Hungary': 'HUN',
  'India': 'IND', 'Indonesia': 'IDN', 'Iran': 'IRN', 'Iraq': 'IRQ',
  'Ireland': 'IRL', 'Israel': 'ISR', 'Italy': 'ITA', 'Jamaica': 'JAM',
  'Japan': 'JPN', 'Jordan': 'JOR', 'Kazakhstan': 'KAZ', 'Kenya': 'KEN',
  'Korea, Republic of': 'KOR', 'Kuwait': 'KWT', 'Kyrgyzstan': 'KGZ',
  'Laos': 'LAO', 'Latvia': 'LVA', 'Lebanon': 'LBN', 'Lesotho': 'LSO',
  'Liberia': 'LBR', 'Libya': 'LBY', 'Lithuania': 'LTU',
  'Macedonia, FYR': 'MKD', 'Madagascar': 'MDG', 'Malawi': 'MWI',
  'Malaysia': 'MYS', 'Mali': 'MLI', 'Mauritania': 'MRT', 'Mexico': 'MEX',
  'Moldova': 'MDA', 'Mongolia': 'MNG', 'Montenegro': 'MNE', 'Morocco': 'MAR',
  'Mozambique': 'MOZ', 'Myanmar (Burma)': 'MMR',
  'Namibia': 'NAM', 'Nepal': 'NPL', 'Netherlands': 'NLD', 'New Zealand': 'NZL',
  'Nicaragua': 'NIC', 'Niger': 'NER', 'Nigeria': 'NGA', 'Norway': 'NOR',
  'Oman': 'OMN', 'Pakistan': 'PAK', 'Palestine': 'PSE', 'Panama': 'PAN',
  'Papua New Guinea': 'PNG', 'Paraguay': 'PRY', 'Peru': 'PER',
  'Philippines': 'PHL', 'Poland': 'POL', 'Portugal': 'PRT', 'Qatar': 'QAT',
  'Romania': 'ROU', 'Russia (Soviet Union)': 'RUS', 'Rwanda': 'RWA',
  'Saudi Arabia': 'SAU', 'Senegal': 'SEN', 'Serbia': 'SRB',
  'Sierra Leone': 'SLE', 'Slovenia': 'SVN', 'Somalia': 'SOM',
  'South Africa': 'ZAF', 'South Sudan': 'SSD', 'Spain': 'ESP',
  'Sri Lanka': 'LKA', 'Sudan': 'SDN', 'Sweden': 'SWE', 'Switzerland': 'CHE',
  'Syria': 'SYR', 'Taiwan': 'TWN', 'Tajikistan': 'TJK', 'Tanzania': 'TZA',
  'Thailand': 'THA', 'Togo': 'TGO', 'Trinidad and Tobago': 'TTO',
  'Tunisia': 'TUN', 'Turkey (Ottoman Empire)': 'TUR', 'Turkmenistan': 'TKM',
  'Uganda': 'UGA', 'Ukraine': 'UKR',
  'United Arab Emirates': 'ARE', 'United Kingdom': 'GBR',
  'United States of America': 'USA', 'Uruguay': 'URY', 'Uzbekistan': 'UZB',
  'Venezuela': 'VEN', 'Vietnam (North Vietnam)': 'VNM', 'Yemen (North Yemen)': 'YEM',
  'Zambia': 'ZMB', 'Zimbabwe': 'ZWE',
  'Serbia (Yugoslavia)': 'SRB', 'Cambodia': 'KHM', 'Bolivia': 'BOL',
  'Myanmar': 'MMR', 'Russia': 'RUS', 'Turkey': 'TUR', 'Vietnam': 'VNM',
  'Yemen': 'YEM', 'Timor-Leste': 'TLS',
  'Kosovo': 'XKX', 'Eswatini': 'SWZ', 'North Macedonia': 'MKD',
};

/* ═══════════════════════════════════════════════════
   Main data loader: merges 4 CSVs into CountryYearRecord[]
   ═══════════════════════════════════════════════════ */

export async function loadCountryYearData(): Promise<CountryYearRecord[]> {
  const [owidRaw, lifeRaw, vdemRaw, conflictRaw] = await Promise.all([
    d3.csv('/data/owid.csv'),
    d3.csv('/data/life-exp.csv'),
    d3.csv('/data/vdem.csv'),
    d3.csv('/data/ged-agg.csv'),
  ]);

  // ── Index life expectancy by iso3+year ──
  const lifeMap = new Map<string, number>();
  for (const r of lifeRaw) {
    const key = `${r.iso3}_${r.year}`;
    const val = parseFloat(r.life_expectancy!);
    if (!isNaN(val)) lifeMap.set(key, val);
  }

  // ── Index democracy score by iso3+year ──
  const demMap = new Map<string, number>();
  for (const r of vdemRaw) {
    const key = `${r.iso3}_${r.year}`;
    const val = parseFloat(r.democracy_score!);
    if (!isNaN(val)) demMap.set(key, val);
  }

  // ── Index conflict by iso3+year (need country→iso3 mapping first) ──
  // Build country→iso3 from owid data (which has clean iso codes)
  const countryToIso = new Map<string, string>();
  for (const r of owidRaw) {
    if (r.iso3 && r.country) countryToIso.set(r.country!, r.iso3!);
  }
  // Add GED-specific names
  for (const [name, iso] of Object.entries(GED_COUNTRY_TO_ISO3)) {
    countryToIso.set(name, iso);
  }

  const conflictMap = new Map<string, { deaths: number; events: number }>();
  for (const r of conflictRaw) {
    const iso = countryToIso.get(r.country!) ?? GED_COUNTRY_TO_ISO3[r.country!] ?? '';
    if (!iso) continue;
    const key = `${iso}_${r.year}`;
    conflictMap.set(key, {
      deaths: +(r.deaths ?? 0),
      events: +(r.events ?? 0),
    });
  }

  // ── Build merged records from OWID (the spine) ──
  const records: CountryYearRecord[] = [];
  const MIN_YEAR = 1990;
  const MAX_YEAR = 2025;

  for (const r of owidRaw) {
    const iso3 = (r.iso3 ?? '').trim();
    const yr = +r.year!;
    if (!iso3 || iso3.length !== 3 || yr < MIN_YEAR || yr > MAX_YEAR) continue;

    const pop = +r.population!;
    const gdpTotal = +r.gdp!;
    if (!pop || isNaN(pop) || pop === 0) continue;

    const key = `${iso3}_${yr}`;
    const dem = demMap.get(key);
    const le = lifeMap.get(key);
    // Skip country-years without democracy data (our core metric)
    if (dem === undefined) continue;

    const coords = COUNTRY_COORDS[iso3] ?? [0, 0];
    const conflict = conflictMap.get(key);

    records.push({
      country: r.country!,
      iso3,
      year: yr,
      population: Math.round(pop),
      gdp_per_capita: gdpTotal && pop ? Math.round(gdpTotal / pop) : 0,
      life_expectancy: le ?? 0,
      democracy_score: Math.round(dem * 1000) / 1000,
      regime_type: classifyRegime(dem),
      conflict_deaths: conflict?.deaths ?? 0,
      conflict_events: conflict?.events ?? 0,
      latitude: coords[0],
      longitude: coords[1],
    });
  }

  console.log(`[dataLoader] Loaded ${records.length} merged country-year records`);
  return records;
}

/* ═══════════════════════════════════════════════════
   Conflict event loader (individual GED events for map dots)
   ═══════════════════════════════════════════════════ */

export async function loadConflictEvents(): Promise<ConflictEvent[]> {
  const raw = await d3.csv('/data/ged-agg.csv');
  const events: ConflictEvent[] = [];
  let id = 1;

  for (const r of raw) {
    const iso3 = GED_COUNTRY_TO_ISO3[r.country!] ?? '';
    events.push({
      id: id++,
      country: r.country!,
      iso3,
      year: +r.year!,
      latitude: +r.latitude!,
      longitude: +r.longitude!,
      deaths: +(r.deaths ?? 0),
      type: 'aggregate',
    });
  }

  return events;
}

/** Load country metadata — derived from OWID data at load time */
export async function loadCountryMeta(): Promise<CountryMeta[]> {
  // Will be populated after main data loads; returning stub
  return [];
}

/** Load world TopoJSON for the map */
export async function loadWorldTopology(): Promise<any> {
  try {
    const resp = await fetch('/data/world-110m.json');
    if (resp.ok) return resp.json();
  } catch {
    // fall through
  }
  return null;
}
