/* ──────────────────────────────────────────────
   ScrollyLayout — builds the scrollytelling DOM
   Left narrative column + sticky chart area
   ────────────────────────────────────────────── */

import type { StoryStep, SectionId } from '../../data/types';

const SECTION_TITLES: Record<SectionId, { number: string; title: string; desc: string }> = {
  intro:                     { number: '', title: '', desc: '' },
  'global-overview':         { number: 'Part I',  title: 'Global Overview',        desc: 'How wealth, health, and governance relate across the world.' },
  'democratic-backsliding':  { number: 'Part II', title: 'Democratic Backsliding', desc: 'Tracking the erosion of liberal democracy across countries.' },
  'regime-change':           { number: 'Part III', title: 'Regime Change',         desc: 'How whole countries shift between regime categories over decades.' },
  conflict:                  { number: 'Part IV', title: 'Conflict',               desc: 'The geography and intensity of organized violence.' },
  conclusion:                { number: '', title: '', desc: '' },
};

export function renderScrollyLayout(
  container: HTMLElement,
  steps: StoryStep[],
): { chartContainer: HTMLElement; stepElements: HTMLElement[] } {
  // Group steps by section so we can insert dividers
  let currentSection: SectionId | null = null;
  const narrativeHtml: string[] = [];
  const sectionSteps = steps.filter(s => s.section !== 'intro' && s.section !== 'conclusion');

  for (const step of sectionSteps) {
    // Insert section divider when entering a new section
    if (step.section !== currentSection) {
      currentSection = step.section;
      const info = SECTION_TITLES[currentSection];
      if (info.title) {
        narrativeHtml.push(`
          <div class="section-divider step" data-step-id="${step.id}-divider">
            <div class="section-divider__number">${info.number}</div>
            <h2 class="section-divider__title">${info.title}</h2>
            <p class="section-divider__desc">${info.desc}</p>
          </div>
        `);
      }
    }

    narrativeHtml.push(`
      <div class="step" data-step-id="${step.id}" data-section="${step.section}">
        <div class="step__card">
          ${step.title ? `<h3 class="step__title">${step.title}</h3>` : ''}
          <p class="step__text">${step.text}</p>
        </div>
      </div>
    `);
  }

  const scrolly = document.createElement('div');
  scrolly.className = 'scrolly';
  scrolly.id = 'scrolly';
  scrolly.innerHTML = `
    <div class="scrolly__narrative" id="narrative">
      ${narrativeHtml.join('\n')}
    </div>
    <div class="scrolly__chart-area">
      <div class="scrolly__chart-container" id="chart-container"></div>
      <div class="scrolly__mobile-card" id="mobile-card" aria-live="polite">
        <div class="mobile-card__inner">
          <h3 class="mobile-card__title"></h3>
          <p class="mobile-card__text"></p>
        </div>
      </div>
    </div>
  `;

  container.appendChild(scrolly);

  const chartContainer = scrolly.querySelector<HTMLElement>('#chart-container')!;
  const stepElements = Array.from(scrolly.querySelectorAll<HTMLElement>('.step'));

  return { chartContainer, stepElements };
}
