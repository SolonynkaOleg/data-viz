/**
 * filter-data.mjs
 * Reads the 4 raw CSV files from src/data/ and writes
 * small filtered versions to public/data/.
 * Run: node scripts/filter-data.mjs
 */

import { createReadStream, createWriteStream, mkdirSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DATA = join(ROOT, 'src', 'data');
const OUT = join(ROOT, 'public', 'data');

mkdirSync(OUT, { recursive: true });

/* ── Helper: parse a CSV header line respecting quotes ── */
function parseHeader(line) {
  // Handle quoted column names
  return line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
}

/* ── Helper: parse a CSV row respecting quotes ── */
function parseRow(line, numCols) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/* ── Filter a CSV file by selecting specific columns ── */
async function filterCSV(inputPath, outputPath, keepCols, filterFn = null, renameMap = null) {
  const name = inputPath.split(/[/\\]/).pop();
  console.log(`Processing ${name}...`);

  const rl = createInterface({
    input: createReadStream(inputPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  let header = null;
  let colIndices = [];
  let outHeader = [];
  let count = 0;
  let written = 0;
  const ws = createWriteStream(outputPath, { encoding: 'utf-8' });

  for await (const line of rl) {
    if (!header) {
      header = parseHeader(line);
      colIndices = keepCols.map(c => {
        const idx = header.indexOf(c);
        if (idx === -1) console.warn(`  WARNING: column "${c}" not found in ${name}. Available: ${header.slice(0, 20).join(', ')}...`);
        return idx;
      }).filter(i => i !== -1);

      outHeader = colIndices.map(i => {
        const original = header[i];
        return renameMap && renameMap[original] ? renameMap[original] : original;
      });
      ws.write(outHeader.join(',') + '\n');
      continue;
    }

    count++;
    const fields = parseRow(line, header.length);

    if (filterFn && !filterFn(fields, header)) continue;

    const values = colIndices.map(i => fields[i] ?? '');
    ws.write(values.join(',') + '\n');
    written++;
  }

  ws.end();
  console.log(`  ${name}: ${count} rows → ${written} rows written to ${outputPath.split(/[/\\]/).pop()}`);
}

/* ═══════════════════════════════════════════════════
   1. V-Dem → vdem.csv  (country_name, country_text_id, year, v2x_libdem)
       Filter: year >= 1970
   ═══════════════════════════════════════════════════ */
await filterCSV(
  join(SRC_DATA, 'V-Dem-CY-Full+Others-v16.csv'),
  join(OUT, 'vdem.csv'),
  ['country_name', 'country_text_id', 'year', 'v2x_libdem'],
  (fields, header) => {
    const yearIdx = header.indexOf('year');
    const yr = parseInt(fields[yearIdx], 10);
    return yr >= 1970 && !isNaN(yr);
  },
  { country_name: 'country', country_text_id: 'iso3', year: 'year', v2x_libdem: 'democracy_score' }
);

/* ═══════════════════════════════════════════════════
   2. GED → ged.csv  (id, country, year, latitude, longitude, best, type_of_violence)
       Filter: year >= 1989
   ═══════════════════════════════════════════════════ */
await filterCSV(
  join(SRC_DATA, 'GEDEvent_v24_1.csv'),
  join(OUT, 'ged.csv'),
  ['id', 'country', 'year', 'latitude', 'longitude', 'best', 'type_of_violence'],
  (fields, header) => {
    const yearIdx = header.indexOf('year');
    const yr = parseInt(fields[yearIdx], 10);
    return yr >= 1989 && !isNaN(yr);
  },
  { best: 'deaths', type_of_violence: 'type' }
);

/* ═══════════════════════════════════════════════════
   3. OWID CO2 → owid.csv  (country, iso_code, year, population, gdp)
       Filter: year >= 1970, has iso_code (skip aggregates)
   ═══════════════════════════════════════════════════ */
await filterCSV(
  join(SRC_DATA, 'owid-co2-data.csv'),
  join(OUT, 'owid.csv'),
  ['country', 'iso_code', 'year', 'population', 'gdp'],
  (fields, header) => {
    const yearIdx = header.indexOf('year');
    const isoIdx = header.indexOf('iso_code');
    const yr = parseInt(fields[yearIdx], 10);
    const iso = (fields[isoIdx] || '').trim();
    return yr >= 1970 && iso.length === 3 && !isNaN(yr);
  },
  { iso_code: 'iso3' }
);

/* ═══════════════════════════════════════════════════
   4. Life expectancy → life-exp.csv
       Already small, just copy with renamed headers
   ═══════════════════════════════════════════════════ */
await filterCSV(
  join(SRC_DATA, 'life-expectancy.csv'),
  join(OUT, 'life-exp.csv'),
  ['Entity', 'Code', 'Year', 'Life expectancy'],
  (fields, header) => {
    const codeIdx = header.indexOf('Code');
    const code = (fields[codeIdx] || '').trim();
    return code.length === 3;  // skip aggregates like "World", "Africa"
  },
  { Entity: 'country', Code: 'iso3', Year: 'year', 'Life expectancy': 'life_expectancy' }
);

console.log('\nDone! Filtered files are in public/data/');
