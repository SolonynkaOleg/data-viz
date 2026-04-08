/* ──────────────────────────────────────────────
   Legend component — renders regime type legend
   ────────────────────────────────────────────── */

import { REGIME_COLORS, REGIME_ORDER } from '../../config/colors';

export function renderLegend(container: HTMLElement): HTMLElement {
  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.id = 'chart-legend';

  for (const regime of REGIME_ORDER) {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.dataset.regime = regime;

    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.style.background = REGIME_COLORS[regime];

    const label = document.createElement('span');
    label.textContent = regime;

    item.appendChild(swatch);
    item.appendChild(label);
    legend.appendChild(item);
  }

  container.appendChild(legend);
  return legend;
}

export function hideLegend(): void {
  const el = document.getElementById('chart-legend');
  if (el) el.style.display = 'none';
}

export function showLegend(): void {
  const el = document.getElementById('chart-legend');
  if (el) el.style.display = 'flex';
}
