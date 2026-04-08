/* ──────────────────────────────────────────────
   Annotation helper — D3-based call-out labels
   ────────────────────────────────────────────── */

import * as d3 from 'd3';

export interface AnnotationConfig {
  x: number;
  y: number;
  dx: number;
  dy: number;
  text: string;
}

export function renderAnnotations(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  annotations: AnnotationConfig[],
): void {
  const sel = g.selectAll<SVGGElement, AnnotationConfig>('.annotation')
    .data(annotations);

  sel.exit().remove();

  const enter = sel.enter()
    .append('g')
    .attr('class', 'annotation');

  enter.append('line').attr('class', 'annotation-line');
  enter.append('text').attr('class', 'annotation-text');

  const merged = enter.merge(sel);

  merged.select('.annotation-line')
    .attr('x1', d => d.x)
    .attr('y1', d => d.y)
    .attr('x2', d => d.x + d.dx)
    .attr('y2', d => d.y + d.dy);

  merged.select('.annotation-text')
    .attr('x', d => d.x + d.dx)
    .attr('y', d => d.y + d.dy - 6)
    .text(d => d.text);
}
