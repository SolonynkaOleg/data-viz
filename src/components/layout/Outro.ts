/* ──────────────────────────────────────────────
   Outro / Conclusion section
   ────────────────────────────────────────────── */

export function renderOutro(container: HTMLElement): HTMLElement {
  const section = document.createElement('section');
  section.id = 'conclusion';
  section.className = 'conclusion';
  section.innerHTML = `
    <h2 class="conclusion__title">What Does the Data Tell Us?</h2>
    <p class="conclusion__text">
      The story of democracy in the 21st century is not one of simple progress or decline.
      Wealth has broadly increased, life expectancy has risen, and some autocracies have
      opened up. But democratic backsliding in established democracies — from Hungary to
      India — reminds us that institutions are fragile. Conflict remains concentrated in
      specific regions, often overlapping with governance failures. The data doesn't
      predict the future, but it shows us where to pay attention.
    </p>
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-card__number" id="stat-countries">40</div>
        <div class="stat-card__label">Countries tracked</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__number" id="stat-years">33</div>
        <div class="stat-card__label">Years of data</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__number" id="stat-backsliding">—</div>
        <div class="stat-card__label">Countries backsliding</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__number" id="stat-conflict">—</div>
        <div class="stat-card__label">Conflict hotspots</div>
      </div>
    </div>
  `;
  container.appendChild(section);
  return section;
}

/** Fill in summary stats from the dataset */
export function updateOutroStats(opts: {
  countries: number;
  years: number;
  backsliding: number;
  conflictHotspots: number;
}): void {
  const set = (id: string, val: string | number) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };
  set('stat-countries', opts.countries);
  set('stat-years', opts.years);
  set('stat-backsliding', opts.backsliding);
  set('stat-conflict', opts.conflictHotspots);
}
