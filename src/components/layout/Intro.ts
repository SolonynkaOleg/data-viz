/* ──────────────────────────────────────────────
   Intro / Hero section
   ────────────────────────────────────────────── */

import * as d3 from 'd3';

export function renderIntro(container: HTMLElement): HTMLElement {
  const section = document.createElement('section');
  section.id = 'intro';
  section.className = 'hero';
  section.innerHTML = `
    <div class="hero__bg" id="hero-bg"></div>
    <h1 class="hero__title">The Decline of Democracy?</h1>
    <p class="hero__subtitle">
      Politics, Development, and Conflict Over Time
    </p>
    <p class="hero__question">
      How have democracy, prosperity, and instability evolved across countries
      over the past three decades? Scroll to explore the data.
    </p>
    <div class="hero__scroll-hint">↓ Scroll to begin</div>
  `;
  container.appendChild(section);

  // Subtle animated background dots
  requestAnimationFrame(() => renderHeroBg(section.querySelector('#hero-bg')!));

  return section;
}

function renderHeroBg(container: HTMLElement): void {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const dots = d3.range(80).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 2 + Math.random() * 6,
  }));

  svg.selectAll('circle')
    .data(dots)
    .join('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', d => d.r)
    .attr('fill', '#457b9d')
    .attr('opacity', 0.15);
}
