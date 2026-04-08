/* ──────────────────────────────────────────────
   Tooltip module — shared across all charts
   ────────────────────────────────────────────── */

import * as d3 from 'd3';

class Tooltip {
  private el: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null;

  init(): void {
    if (this.el) return;
    this.el = d3.select('body')
      .append('div')
      .attr('class', 'viz-tooltip')
      .style('opacity', 0);
  }

  show(html: string, event: MouseEvent): void {
    if (!this.el) this.init();
    this.el!
      .html(html)
      .style('opacity', 1);
    this.position(event);
  }

  move(event: MouseEvent): void {
    this.position(event);
  }

  private position(event: MouseEvent): void {
    if (!this.el) return;
    const node = this.el.node()!;
    const ttW = node.offsetWidth || 200;
    const ttH = node.offsetHeight || 60;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = event.pageX + 14;
    let top = event.pageY - 28;

    // Keep tooltip within viewport horizontally
    if (left + ttW > vw - 8) {
      left = event.pageX - ttW - 14;
    }
    if (left < 8) left = 8;

    // Keep tooltip within viewport vertically
    if (top + ttH > window.scrollY + vh - 8) {
      top = event.pageY - ttH - 12;
    }
    if (top < window.scrollY + 8) top = window.scrollY + 8;

    this.el
      .style('left', `${left}px`)
      .style('top', `${top}px`);
  }

  hide(): void {
    this.el?.style('opacity', 0);
  }

  destroy(): void {
    this.el?.remove();
    this.el = null;
  }
}

export const tooltip = new Tooltip();
