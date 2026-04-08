/* ──────────────────────────────────────────────
   LineChart — Democracy score over time
   Small-multiples approach with highlighted lines
   ────────────────────────────────────────────── */

import * as d3 from 'd3';
import type { ChartModule, ChartState, CountryYearRecord, DemocracySeries } from '../../data/types';
import { ACCENT, REGION_COLORS, GRAY } from '../../config/colors';
import { getDimensions, CHART_MARGINS, TRANSITION, YEAR_RANGE } from '../../config/dimensions';
import { tooltip } from '../../core/tooltip';
import { buildDemocracySeries, getCountryList } from '../../data/dataTransform';

const LINE_COLORS = [
  '#1d3557', '#e63946', '#457b9d', '#2a7f62',
  '#e2a148', '#6c5ce7', '#d35400', '#00b894',
];

export class LineChart implements ChartModule {
  private container!: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xScale!: d3.ScaleLinear<number, number>;
  private yScale!: d3.ScaleLinear<number, number>;
  private lineGen!: d3.Line<{ year: number; score: number }>;
  private allCountries: string[] = [];
  private initialized = false;

  init(container: HTMLElement): void {
    this.container = container;
    tooltip.init();

    // Scales (domain-only; range set in update when container is visible)
    this.xScale = d3.scaleLinear().domain(YEAR_RANGE);
    this.yScale = d3.scaleLinear().domain([0, 1]);

    this.lineGen = d3.line<{ year: number; score: number }>()
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.score))
      .curve(d3.curveMonotoneX);
  }

  /** Build the SVG skeleton — called on first visible update and on resize */
  private buildSvg(dim: ReturnType<typeof getDimensions>): void {
    // Remove old SVG if rebuilding
    if (this.svg) this.svg.remove();

    this.svg = d3.select(this.container)
      .append('svg')
      .attr('class', 'chart-svg line-chart');

    this.g = this.svg.append('g')
      .attr('transform', `translate(${dim.margin.left},${dim.margin.top})`);

    // Grid placeholder
    this.g.append('g').attr('class', 'grid grid--y');

    // Axes
    this.g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${dim.boundedHeight})`);

    this.g.append('g')
      .attr('class', 'axis axis--y');

    // Axis labels
    this.g.append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', dim.boundedWidth / 2)
      .attr('y', dim.boundedHeight + 42)
      .text('Year');

    this.g.append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -dim.boundedHeight / 2)
      .attr('y', -44)
      .text('Liberal Democracy Index');

    // Threshold lines
    const thresholds = [
      { y: 0.70, label: 'Full democracy' },
      { y: 0.50, label: 'Flawed democracy' },
      { y: 0.25, label: 'Hybrid regime' },
    ];

    for (const th of thresholds) {
      this.g.append('line')
        .attr('class', 'threshold-line')
        .attr('x1', 0)
        .attr('x2', dim.boundedWidth)
        .attr('y1', this.yScale(th.y))
        .attr('y2', this.yScale(th.y))
        .attr('stroke', GRAY[300])
        .attr('stroke-dasharray', '6,4')
        .attr('stroke-width', 1);

      this.g.append('text')
        .attr('class', 'threshold-label')
        .attr('x', dim.boundedWidth + 6)
        .attr('y', this.yScale(th.y))
        .attr('dy', '0.35em')
        .attr('font-size', '10px')
        .attr('fill', GRAY[500])
        .text(th.label);
    }

    this.initialized = true;
  }

  update(state: ChartState, data: CountryYearRecord[]): void {
    const dim = getDimensions(this.container, CHART_MARGINS.line);

    // Guard: container not visible yet
    if (dim.boundedWidth <= 0 || dim.boundedHeight <= 0) return;

    // Update scale ranges to match current container size
    this.xScale.range([0, dim.boundedWidth]);
    this.yScale.range([dim.boundedHeight, 0]);

    // Build SVG skeleton on first visible call (or after resize)
    if (!this.initialized) {
      this.buildSvg(dim);
    }

    // Update axes
    this.g.select<SVGGElement>('.axis--x')
      .attr('transform', `translate(0,${dim.boundedHeight})`)
      .call(d3.axisBottom(this.xScale).tickFormat(d3.format('d')).ticks(8));

    this.g.select<SVGGElement>('.axis--y')
      .call(d3.axisLeft(this.yScale).ticks(5));

    // Grid
    this.g.select('.grid--y')
      .call(g => {
        g.selectAll('line').remove();
        g.selectAll('line')
          .data(this.yScale.ticks(5))
          .join('line')
          .attr('x1', 0)
          .attr('x2', dim.boundedWidth)
          .attr('y1', d => this.yScale(d))
          .attr('y2', d => this.yScale(d))
          .attr('stroke', '#e8e8ee')
          .attr('stroke-dasharray', '2,4');
      });

    // Build all series (for background) and highlighted series
    if (this.allCountries.length === 0) {
      this.allCountries = getCountryList(data).map(c => c.iso3);
    }

    const allSeries = buildDemocracySeries(data, this.allCountries);
    const selectedIsos = state.selectedCountries.length > 0
      ? state.selectedCountries
      : ['USA', 'TUR', 'HUN', 'BRA', 'IND', 'POL'];
    const selectedSet = new Set(selectedIsos);

    // Background lines
    const bgLines = this.g.selectAll<SVGPathElement, DemocracySeries>('.line-bg')
      .data(allSeries.filter(s => !selectedSet.has(s.iso3)), d => d.iso3);

    bgLines.exit().remove();

    bgLines.enter()
      .append('path')
      .attr('class', 'line-bg line-path line-path--muted')
      .merge(bgLines)
      .attr('d', s => this.lineGen(s.values))
      .attr('stroke', GRAY[400]);

    // Highlighted lines
    const hlSeries = allSeries.filter(s => selectedSet.has(s.iso3));

    const hlLines = this.g.selectAll<SVGPathElement, DemocracySeries>('.line-hl')
      .data(hlSeries, d => d.iso3);

    hlLines.exit()
      .transition().duration(TRANSITION.fast)
      .attr('opacity', 0)
      .remove();

    hlLines.enter()
      .append('path')
      .attr('class', 'line-hl line-path line-path--highlight')
      .attr('opacity', 0)
      .merge(hlLines)
      .on('mouseover', (event: MouseEvent, d: DemocracySeries) => {
        this.showLineTooltip(event, d);
      })
      .on('mousemove', (event: MouseEvent, d: DemocracySeries) => {
        this.showLineTooltip(event, d);
      })
      .on('mouseout', () => tooltip.hide())
      .transition().duration(TRANSITION.normal)
      .attr('d', s => this.lineGen(s.values))
      .attr('stroke', (_, i) => LINE_COLORS[i % LINE_COLORS.length])
      .attr('opacity', 1);

    // End labels
    const labels = this.g.selectAll<SVGTextElement, DemocracySeries>('.line-label')
      .data(hlSeries, d => d.iso3);

    labels.exit().remove();

    labels.enter()
      .append('text')
      .attr('class', 'line-label')
      .merge(labels)
      .transition().duration(TRANSITION.normal)
      .attr('x', d => this.xScale(d.values[d.values.length - 1].year) + 6)
      .attr('y', d => this.yScale(d.values[d.values.length - 1].score))
      .attr('fill', (_, i) => LINE_COLORS[i % LINE_COLORS.length])
      .text(d => d.iso3);
  }

  /** Show tooltip with score for the year nearest to cursor */
  private showLineTooltip(event: MouseEvent, series: DemocracySeries): void {
    // Get mouse x relative to the g group
    const [mx] = d3.pointer(event, this.g.node());
    const hoveredYear = Math.round(this.xScale.invert(mx));

    // Find the data point closest to the hovered year
    const bisect = d3.bisector((d: { year: number }) => d.year).left;
    const idx = bisect(series.values, hoveredYear);
    const d0 = series.values[idx - 1];
    const d1 = series.values[idx];
    let closest: { year: number; score: number };

    if (!d0) closest = d1 ?? series.values[0];
    else if (!d1) closest = d0;
    else closest = (hoveredYear - d0.year <= d1.year - hoveredYear) ? d0 : d1;

    tooltip.show(
      `<strong>${series.country}</strong> (${closest.year})<br/>` +
      `<div class="tt-row"><span class="tt-label">Democracy Index:</span> ` +
      `<span class="tt-value">${closest.score.toFixed(3)}</span></div>`,
      event,
    );
  }

  resize(): void {
    if (!this.container) return;
    this.initialized = false;
    this.allCountries = [];
    if (this.svg) this.svg.remove();
  }

  destroy(): void {
    this.svg?.remove();
    tooltip.hide();
  }
}
