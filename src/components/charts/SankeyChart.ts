/* ──────────────────────────────────────────────
   SankeyChart — Regime transitions between years
   Alluvial-style flow from regime categories at
   yearFrom to regime categories at yearTo
   ────────────────────────────────────────────── */

import * as d3 from 'd3';
import type { ChartModule, ChartState, CountryYearRecord, RegimeType } from '../../data/types';
import { REGIME_COLORS, REGIME_ORDER } from '../../config/colors';
import { getDimensions, CHART_MARGINS, TRANSITION } from '../../config/dimensions';
import { tooltip } from '../../core/tooltip';
import { buildRegimeTransitions } from '../../data/dataTransform';

interface SankeyNode {
  id: string;
  label: string;
  regime: RegimeType;
  side: 'left' | 'right';
  x: number;
  y: number;
  height: number;
  count: number;
}

interface SankeyLink {
  source: SankeyNode;
  target: SankeyNode;
  count: number;
  countries: string[];
  sourceOffset: number;
  targetOffset: number;
  thickness: number;
}

export class SankeyChart implements ChartModule {
  private container!: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private built = false;

  init(container: HTMLElement): void {
    this.container = container;
    tooltip.init();
  }

  private buildSvg(dim: ReturnType<typeof getDimensions>): void {
    if (this.svg) this.svg.remove();

    this.svg = d3.select(this.container)
      .append('svg')
      .attr('class', 'chart-svg sankey-chart');

    this.g = this.svg.append('g')
      .attr('transform', `translate(${dim.margin.left},${dim.margin.top})`);

    this.built = true;
  }

  update(state: ChartState, data: CountryYearRecord[]): void {
    const [yearFrom, yearTo] = state.transitionYears ?? [2000, 2020];
    const transitions = buildRegimeTransitions(data, yearFrom, yearTo);
    const dim = getDimensions(this.container, CHART_MARGINS.sankey);
    const W = dim.boundedWidth;
    const H = dim.boundedHeight;

    if (W <= 0 || H <= 0) return;
    if (!this.built) this.buildSvg(dim);

    // Compute flow matrix
    type FlowKey = `${RegimeType}→${RegimeType}`;
    const flows = new Map<FlowKey, number>();
    const flowCountries = new Map<FlowKey, string[]>();
    const leftCounts = new Map<RegimeType, number>();
    const rightCounts = new Map<RegimeType, number>();

    for (const r of REGIME_ORDER) {
      leftCounts.set(r, 0);
      rightCounts.set(r, 0);
    }

    for (const t of transitions) {
      const key: FlowKey = `${t.regimeFrom}→${t.regimeTo}`;
      flows.set(key, (flows.get(key) ?? 0) + 1);
      if (!flowCountries.has(key)) flowCountries.set(key, []);
      flowCountries.get(key)!.push(t.country);
      leftCounts.set(t.regimeFrom, (leftCounts.get(t.regimeFrom) ?? 0) + 1);
      rightCounts.set(t.regimeTo, (rightCounts.get(t.regimeTo) ?? 0) + 1);
    }

    const total = transitions.length || 1;
    const nodeWidth = 28;
    const nodePad = 16;

    // Build nodes
    const buildNodes = (
      counts: Map<RegimeType, number>,
      side: 'left' | 'right',
      x: number,
    ): SankeyNode[] => {
      const nodes: SankeyNode[] = [];
      let yOff = 0;
      for (const regime of REGIME_ORDER) {
        const count = counts.get(regime) ?? 0;
        const h = (count / total) * (H - (REGIME_ORDER.length - 1) * nodePad);
        nodes.push({
          id: `${side}-${regime}`,
          label: regime,
          regime,
          side,
          x,
          y: yOff,
          height: Math.max(h, 2),
          count,
        });
        yOff += h + nodePad;
      }
      return nodes;
    };

    const leftNodes = buildNodes(leftCounts, 'left', 0);
    const rightNodes = buildNodes(rightCounts, 'right', W - nodeWidth);

    // Build links
    const leftMap = new Map(leftNodes.map(n => [n.regime, n]));
    const rightMap = new Map(rightNodes.map(n => [n.regime, n]));

    const sourceOffsets = new Map<RegimeType, number>();
    const targetOffsets = new Map<RegimeType, number>();
    for (const r of REGIME_ORDER) {
      sourceOffsets.set(r, 0);
      targetOffsets.set(r, 0);
    }

    const links: SankeyLink[] = [];
    for (const fromR of REGIME_ORDER) {
      for (const toR of REGIME_ORDER) {
        const count = flows.get(`${fromR}→${toR}`) ?? 0;
        if (count === 0) continue;

        const source = leftMap.get(fromR)!;
        const target = rightMap.get(toR)!;
        const thickness = (count / total) * (H - (REGIME_ORDER.length - 1) * nodePad);

        links.push({
          source,
          target,
          count,
          countries: (flowCountries.get(`${fromR}→${toR}`) ?? []).sort(),
          sourceOffset: sourceOffsets.get(fromR)!,
          targetOffset: targetOffsets.get(toR)!,
          thickness: Math.max(thickness, 1),
        });

        sourceOffsets.set(fromR, sourceOffsets.get(fromR)! + thickness);
        targetOffsets.set(toR, targetOffsets.get(toR)! + thickness);
      }
    }

    // ── Render ──

    // Links
    const linkSel = this.g.selectAll<SVGPathElement, SankeyLink>('.sankey-link')
      .data(links, d => `${d.source.regime}→${d.target.regime}`);

    linkSel.exit()
      .transition().duration(TRANSITION.normal)
      .attr('stroke-opacity', 0)
      .remove();

    linkSel.enter()
      .append('path')
      .attr('class', 'sankey-link')
      .attr('stroke-opacity', 0)
      .merge(linkSel)
      .on('mouseover', (event, d) => {
        const list = d.countries.length <= 20
          ? d.countries.join(', ')
          : d.countries.slice(0, 20).join(', ') + ` … and ${d.countries.length - 20} more`;
        tooltip.show(
          `<strong>${d.source.regime} → ${d.target.regime}</strong><br/>` +
          `<span style="font-size:13px;font-weight:600">${d.count} countries</span><br/>` +
          `<span style="font-size:11px;line-height:1.4;display:inline-block;max-width:300px">${list}</span>`,
          event,
        );
      })
      .on('mousemove', (event) => tooltip.move(event))
      .on('mouseout', () => tooltip.hide())
      .transition().duration(TRANSITION.slow)
      .attr('d', d => {
        const sy = d.source.y + d.sourceOffset + d.thickness / 2;
        const ty = d.target.y + d.targetOffset + d.thickness / 2;
        const sx = nodeWidth;
        const tx = W - nodeWidth;
        const midX = (sx + tx) / 2;
        return `M${sx},${sy} C${midX},${sy} ${midX},${ty} ${tx},${ty}`;
      })
      .attr('stroke', d => REGIME_COLORS[d.source.regime])
      .attr('stroke-width', d => d.thickness)
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.35);

    // Nodes
    const allNodes = [...leftNodes, ...rightNodes];

    const nodeSel = this.g.selectAll<SVGGElement, SankeyNode>('.sankey-node')
      .data(allNodes, d => d.id);

    nodeSel.exit().remove();

    const nodeEnter = nodeSel.enter()
      .append('g')
      .attr('class', 'sankey-node');

    nodeEnter.append('rect');
    nodeEnter.append('text');

    const nodeUpdate = nodeEnter.merge(nodeSel);

    nodeUpdate.select('rect')
      .transition().duration(TRANSITION.slow)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', nodeWidth)
      .attr('height', d => d.height)
      .attr('fill', d => REGIME_COLORS[d.regime])
      .attr('rx', 3);

    nodeUpdate.select('text')
      .transition().duration(TRANSITION.slow)
      .attr('x', d => d.side === 'left' ? d.x + nodeWidth + 8 : d.x - 8)
      .attr('y', d => d.y + d.height / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.side === 'left' ? 'start' : 'end')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#1a1a2e')
      .text(d => d.count > 0 ? `${d.label} (${d.count})` : '');

    // Year labels
    this.g.selectAll('.sankey-year').remove();

    this.g.append('text')
      .attr('class', 'sankey-year')
      .attr('x', nodeWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#1d3557')
      .text(yearFrom);

    this.g.append('text')
      .attr('class', 'sankey-year')
      .attr('x', W - nodeWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#1d3557')
      .text(yearTo);
  }

  resize(): void {
    if (!this.container) return;
    this.built = false;
    if (this.svg) this.svg.remove();
  }

  destroy(): void {
    this.svg?.remove();
    tooltip.hide();
  }
}
