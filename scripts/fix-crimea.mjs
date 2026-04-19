/**
 * fix-crimea.mjs
 * Transfers the Crimea polygon from Russia to Ukraine
 * in the world-110m.json TopoJSON file.
 *
 * Usage:  node scripts/fix-crimea.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '..', 'public', 'data', 'world-110m.json');

const topo = JSON.parse(readFileSync(filePath, 'utf8'));
const geometries = topo.objects.countries.geometries;

// Find Russia (ISO numeric 643) and Ukraine (ISO numeric 804)
const russiaIdx = geometries.findIndex(g => g.id === '643');
const ukraineIdx = geometries.findIndex(g => g.id === '804');

if (russiaIdx === -1 || ukraineIdx === -1) {
  console.error('Could not find Russia or Ukraine in the TopoJSON.');
  process.exit(1);
}

const russia = geometries[russiaIdx];
const ukraine = geometries[ukraineIdx];

console.log(`Russia  — type: ${russia.type}, polygons: ${russia.arcs.length}`);
console.log(`Ukraine — type: ${ukraine.type}`);

// --- Identify Crimea polygon in Russia ---
// We need to decode coordinates to find the polygon whose centroid
// is near (34°E, 45°N). We'll use a simple arc-decoding approach.

function decodeArc(arcIdx) {
  const idx = arcIdx < 0 ? ~arcIdx : arcIdx;
  const arc = topo.arcs[idx];
  const decoded = [];
  let x = 0, y = 0;
  for (const [dx, dy] of arc) {
    x += dx;
    y += dy;
    decoded.push([
      x * topo.transform.scale[0] + topo.transform.translate[0],
      y * topo.transform.scale[1] + topo.transform.translate[1],
    ]);
  }
  return arcIdx < 0 ? decoded.reverse() : decoded;
}

function decodeRing(ringArcs) {
  const coords = [];
  for (const arcIdx of ringArcs) {
    const pts = decodeArc(arcIdx);
    // skip first point of subsequent arcs (shared with previous arc end)
    coords.push(...(coords.length === 0 ? pts : pts.slice(1)));
  }
  return coords;
}

function centroid(ring) {
  const coords = decodeRing(ring);
  const avgLon = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  return { lon: avgLon, lat: avgLat };
}

// Russia's arcs is an array of polygons; each polygon is [outerRing, ...holes]
let crimeaPolyIdx = -1;
for (let i = 0; i < russia.arcs.length; i++) {
  const outerRing = russia.arcs[i][0]; // first ring = outer boundary
  const c = centroid(outerRing);
  // Crimea: lon ~32.5-36.5, lat ~44.4-46.2
  if (c.lon > 30 && c.lon < 38 && c.lat > 43 && c.lat < 47) {
    crimeaPolyIdx = i;
    console.log(`Found Crimea at Russia polygon index ${i} — centroid: ${c.lon.toFixed(1)}°E, ${c.lat.toFixed(1)}°N`);
    break;
  }
}

if (crimeaPolyIdx === -1) {
  console.error('Could not find Crimea polygon in Russia. It may have already been transferred.');
  process.exit(1);
}

// --- Transfer Crimea ---

// 1. Remove Crimea polygon from Russia
const [crimeaArcs] = russia.arcs.splice(crimeaPolyIdx, 1);

// If Russia now has only 1 polygon, downgrade to Polygon
if (russia.arcs.length === 1) {
  russia.type = 'Polygon';
  russia.arcs = russia.arcs[0];
}
console.log(`Russia after removal — type: ${russia.type}, polygons: ${russia.arcs.length}`);

// 2. Add Crimea polygon to Ukraine
if (ukraine.type === 'Polygon') {
  // Convert Ukraine to MultiPolygon: [originalPolygon, crimeaPolygon]
  ukraine.type = 'MultiPolygon';
  ukraine.arcs = [ukraine.arcs, crimeaArcs];
} else {
  // Already MultiPolygon — just push
  ukraine.arcs.push(crimeaArcs);
}
console.log(`Ukraine after addition — type: ${ukraine.type}, polygons: ${ukraine.arcs.length}`);

// --- Save ---
writeFileSync(filePath, JSON.stringify(topo));
console.log(`\n✅ Saved updated TopoJSON to ${filePath}`);
