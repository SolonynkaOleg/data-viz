/* ──────────────────────────────────────────────
   ScatterPlot — GDP vs Life Expectancy
   Bubble size = population, color = regime type
   ────────────────────────────────────────────── */

import * as d3 from 'd3';
import type { ChartModule, ChartState, CountryYearRecord } from '../../data/types';
import { REGIME_COLORS } from '../../config/colors';
import { getDimensions, CHART_MARGINS, TRANSITION } from '../../config/dimensions';
import { tooltip } from '../../core/tooltip';
import { filterByYear } from '../../data/dataTransform';

export class ScatterPlot implements ChartModule {
  private container!: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xScale!: d3.ScaleLogarithmic<number, number>;
  private yScale!: d3.ScaleLinear<number, number>;
  private rScale!: d3.ScalePower<number, number>;
  private yearLabel!: d3.Selection<SVGTextElement, unknown, null, undefined>;
  private animTimer: d3.Timer | null = null;
  private built = false;

  init(container: HTMLElement): void {
    this.container = container;
    tooltip.init();

    this.xScale = d3.scaleLog().domain([300, 120000]);
    this.yScale = d3.scaleLinear().domain([38, 88]);
    this.rScale = d3.scaleSqrt().domain([0, 1.5e9]).range([3, 40]);
  }

  private buildSvg(dim: ReturnType<typeof getDimensions>): void {
    if (this.svg) this.svg.remove();

    this.svg = d3.select(this.container)
      .append('svg')
      .attr('class', 'chart-svg scatter-chart');

    this.g = this.svg.append('g')
      .attr('transform', `translate(${dim.margin.left},${dim.margin.top})`);

    // Axes
    this.g.append('g').attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${dim.boundedHeight})`);
    this.g.append('g').attr('class', 'axis axis--y');

    // Grid
    this.g.append('g').attr('class', 'grid grid--y');

    // Axis labels
    this.g.append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', dim.boundedWidth / 2)
      .attr('y', dim.boundedHeight + 42)
      .text('GDP per capita (PPP, log scale)');

    this.g.append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90)`)
      .attr('x', -dim.boundedHeight / 2)
      .attr('y', -50)
      .text('Life expectancy (years)');

    // Year badge
    this.yearLabel = this.g.append('text')
      .attr('class', 'year-badge')
      .attr('x', dim.boundedWidth - 10)
      .attr('y', dim.boundedHeight - 10);

    this.built = true;
  }

  update(state: ChartState, data: CountryYearRecord[]): void {
    // Stop any running animation
    if (this.animTimer) {
      this.animTimer.stop();
      this.animTimer = null;
    }

    if (state.animating) {
      this.animate(state, data);
      return;
    }

    this.renderYear(state.year, data, state);
  }

  private renderYear(year: number, data: CountryYearRecord[], state: ChartState): void {
    const dim = getDimensions(this.container, CHART_MARGINS.scatter);
    if (dim.boundedWidth <= 0 || dim.boundedHeight <= 0) return;

    // Update scale ranges to current container size
    this.xScale.range([0, dim.boundedWidth]);
    this.yScale.range([dim.boundedHeight, 0]);
    this.rScale.range([3, 40]);

    if (!this.built) this.buildSvg(dim);

    // Update axes
    this.g.select<SVGGElement>('.axis--x')
      .attr('transform', `translate(0,${dim.boundedHeight})`)
      .transition().duration(TRANSITION.fast)
      .call(d3.axisBottom(this.xScale)
        .tickValues([500, 1000, 2000, 5000, 10000, 25000, 50000, 100000])
        .tickFormat(d => d3.format(',.0f')(d as number))
      );

    this.g.select<SVGGElement>('.axis--y')
      .transition().duration(TRANSITION.fast)
      .call(d3.axisLeft(this.yScale).ticks(6));

    // Grid
    this.g.select('.grid--y')
      .call(g => {
        g.selectAll('line').remove();
        const ticks = this.yScale.ticks(6);
        g.selectAll('line')
          .data(ticks)
          .join('line')
          .attr('x1', 0)
          .attr('x2', dim.boundedWidth)
          .attr('y1', d => this.yScale(d))
          .attr('y2', d => this.yScale(d))
          .attr('stroke', '#e8e8ee')
          .attr('stroke-dasharray', '2,4');
      });

    // Year label
    this.yearLabel
      .attr('x', dim.boundedWidth - 10)
      .attr('y', dim.boundedHeight - 10)
      .text(year);

    // Data join — filter out records that would break the log scale
    const yearData = filterByYear(data, year)
      .filter(d => d.gdp_per_capita > 0 && d.life_expectancy > 0);
    const selectedSet = new Set(state.selectedCountries);
    const hasSelection = selectedSet.size > 0;

    const bubbles = this.g.selectAll<SVGCircleElement, CountryYearRecord>('.bubble')
      .data(yearData, d => d.iso3);

    bubbles.exit()
      .transition().duration(TRANSITION.fast)
      .attr('r', 0)
      .remove();

    const enter = bubbles.enter()
      .append('circle')
      .attr('class', 'bubble')
      .attr('cx', d => this.xScale(d.gdp_per_capita))
      .attr('cy', d => this.yScale(d.life_expectancy))
      .attr('r', 0);

    enter.merge(bubbles)
      .on('mouseover', (event, d) => {
        tooltip.show(this.tooltipHtml(d), event);
      })
      .on('mousemove', (event) => tooltip.move(event))
      .on('mouseout', () => tooltip.hide())
      .transition().duration(TRANSITION.normal)
      .attr('cx', d => this.xScale(d.gdp_per_capita))
      .attr('cy', d => this.yScale(d.life_expectancy))
      .attr('r', d => this.rScale(d.population))
      .attr('fill', d => REGIME_COLORS[d.regime_type])
      .attr('opacity', d =>
        hasSelection
          ? selectedSet.has(d.iso3) ? 0.85 : 0.1
          : 0.75
      );
  }

  private animate(state: ChartState, data: CountryYearRecord[]): void {
    const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
    let idx = 0;

    this.animTimer = d3.interval(() => {
      if (idx >= years.length) {
        this.animTimer?.stop();
        this.animTimer = null;
        return;
      }
      this.renderYear(years[idx], data, { ...state, animating: false });
      idx++;
    }, 250);
  }

  private tooltipHtml(d: CountryYearRecord): string {
    return `
      <strong>${d.country}</strong> (${d.year})<br/>
      <div class="tt-row"><span class="tt-label">GDP/cap:</span> <span class="tt-value">$${d3.format(',.0f')(d.gdp_per_capita)}</span></div>
      <div class="tt-row"><span class="tt-label">Life exp:</span> <span class="tt-value">${d.life_expectancy} yr</span></div>
      <div class="tt-row"><span class="tt-label">Population:</span> <span class="tt-value">${d3.format('.2s')(d.population)}</span></div>
      <div class="tt-row"><span class="tt-label">Regime:</span> <span class="tt-value">${d.regime_type}</span></div>
      <div class="tt-row"><span class="tt-label">Dem. score:</span> <span class="tt-value">${d.democracy_score.toFixed(2)}</span></div>
    `;
  }

  resize(): void {
    if (!this.container) return;
    this.built = false;
    if (this.svg) this.svg.remove();
  }

  destroy(): void {
    if (this.animTimer) this.animTimer.stop();
    this.svg?.remove();
    tooltip.hide();
  }
}
