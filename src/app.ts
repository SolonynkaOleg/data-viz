/* ──────────────────────────────────────────────
   App — orchestrates the entire application
   Wires up data, layout, charts, and scrollama
   ────────────────────────────────────────────── */

import { loadCountryYearData, loadConflictEvents } from './data/dataLoader';
import { STORY_STEPS } from './config/story';
import { appState } from './core/state';
import { eventBus } from './core/eventBus';
import { tooltip } from './core/tooltip';
import { initResponsive } from './core/responsive';
import { renderHeader } from './components/layout/Header';
import { renderIntro } from './components/layout/Intro';
import { renderOutro, updateOutroStats } from './components/layout/Outro';
import { renderScrollyLayout } from './components/layout/ScrollyLayout';
import { ScatterPlot } from './components/charts/ScatterPlot';
import { LineChart } from './components/charts/LineChart';
import { SankeyChart } from './components/charts/SankeyChart';
import { WorldMap } from './components/charts/WorldMap';
import { renderLegend, showLegend, hideLegend } from './components/ui/Legend';
import { YearSlider } from './components/ui/YearSlider';
import { CountrySelect } from './components/ui/CountrySelect';
import { initScrollama, resizeScrollama } from './scrolly/scrollamaSetup';
import type { ChartState, SectionId, ChartModule } from './data/types';

export async function initApp(): Promise<void> {
  const root = document.getElementById('app')!;
  root.innerHTML = '';

  // ── 1. Load data ──────────────────────────────
  const [data, conflictEvents] = await Promise.all([
    loadCountryYearData(),
    loadConflictEvents(),
  ]);
  appState.setData(data);
  appState.setConflictEvents(conflictEvents);

  // ── 2. Render layout ──────────────────────────
  renderHeader(root);
  renderIntro(root);

  const { chartContainer, stepElements } = renderScrollyLayout(root, STORY_STEPS);
  renderOutro(root);
  renderFooter(root);

  // ── 3. Initialize charts ──────────────────────
  // Create separate container divs for each chart
  const chartDivs = createChartDivs(chartContainer);

  const scatterPlot = new ScatterPlot();
  const lineChart = new LineChart();
  const sankeyChart = new SankeyChart();
  const worldMap = new WorldMap();

  scatterPlot.init(chartDivs['global-overview']);
  lineChart.init(chartDivs['democratic-backsliding']);
  sankeyChart.init(chartDivs['regime-change']);
  worldMap.init(chartDivs['conflict']);

  const chartMap: Record<SectionId, ChartModule | null> = {
    intro: null,
    'global-overview': scatterPlot,
    'democratic-backsliding': lineChart,
    'regime-change': sankeyChart,
    conflict: worldMap,
    conclusion: null,
  };

  // ── 4. UI controls ───────────────────────────
  const legend = renderLegend(chartContainer);
  const yearSlider = new YearSlider();
  yearSlider.render(chartContainer);
  const countrySelect = new CountrySelect();
  countrySelect.render(chartContainer, data);

  // ── 5. Scene system — listen for state changes ─
  function updateScene(state: ChartState): void {
    const section = state.activeSection;

    // Show/hide chart containers
    for (const [key, div] of Object.entries(chartDivs)) {
      div.style.display = key === section ? 'block' : 'none';
    }

    // Show/hide UI elements per section
    if (section === 'global-overview') {
      showLegend();
      yearSlider.show();
      yearSlider.setRange(1990, 2022);
      countrySelect.show();
      yearSlider.setYear(state.year);
    } else {
      hideLegend();
      yearSlider.hide();
      countrySelect.hide();
    }

    // Update the active chart
    const chart = chartMap[section];
    if (chart) {
      chart.update(state, data);
    }
  }

  eventBus.on('stateChange', updateScene);

  // ── 6. Responsive ────────────────────────────
  initResponsive();
  eventBus.on('resize', () => {
    for (const chart of Object.values(chartMap)) {
      if (chart) chart.resize();
    }
    resizeScrollama();
    // Re-render current state after resize
    updateScene(appState.chartState);
  });

  // ── 7. Init Scrollama ────────────────────────
  // Small delay to ensure DOM is laid out
  requestAnimationFrame(() => {
    initScrollama('.step');
  });

  // ── 8. Compute conclusion stats ──────────────
  const countries = new Set(data.map(d => d.iso3));
  const years = new Set(data.map(d => d.year));
  const backsliders = countBacksliders(data);
  const hotspots = countConflictHotspots(data);

  updateOutroStats({
    countries: countries.size,
    years: years.size,
    backsliding: backsliders,
    conflictHotspots: hotspots,
  });

  // ── 9. Initial render ────────────────────────
  tooltip.init();
  appState.updateChart({ activeSection: 'intro' });
}

/* ── Helpers ─────────────────────────────────── */

function createChartDivs(parent: HTMLElement): Record<string, HTMLElement> {
  const sections: SectionId[] = [
    'global-overview',
    'democratic-backsliding',
    'regime-change',
    'conflict',
  ];

  const divs: Record<string, HTMLElement> = {};
  for (const section of sections) {
    const div = document.createElement('div');
    div.className = 'chart-panel';
    div.id = `chart-${section}`;
    div.style.cssText = 'width:100%;height:100%;display:none;position:absolute;inset:0;';
    parent.appendChild(div);
    divs[section] = div;
  }
  return divs;
}

function countBacksliders(data: typeof appState.data): number {
  const byCountry = new Map<string, { first: number; last: number }>();
  for (const r of data) {
    if (!byCountry.has(r.iso3)) {
      byCountry.set(r.iso3, { first: r.democracy_score, last: r.democracy_score });
    }
    if (r.year <= 1995) byCountry.get(r.iso3)!.first = r.democracy_score;
    if (r.year >= 2020) byCountry.get(r.iso3)!.last = r.democracy_score;
  }
  let count = 0;
  for (const vals of byCountry.values()) {
    if (vals.last < vals.first - 0.05) count++;
  }
  return count;
}

function countConflictHotspots(data: typeof appState.data): number {
  const byCountry = new Map<string, number>();
  for (const r of data) {
    if (r.year >= 2015) {
      byCountry.set(r.iso3, (byCountry.get(r.iso3) ?? 0) + r.conflict_deaths);
    }
  }
  let count = 0;
  for (const deaths of byCountry.values()) {
    if (deaths > 1000) count++;
  }
  return count;
}

function renderFooter(root: HTMLElement): void {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <p>
      Data Visualization Project · Built with D3.js, Scrollama, and TypeScript<br/>
      Sources: Our World in Data · V-Dem · UCDP · Natural Earth
    </p>
  `;
  root.appendChild(footer);
}
