/* ──────────────────────────────────────────────
   Header component — minimal top bar
   ────────────────────────────────────────────── */

export function renderHeader(container: HTMLElement): void {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="site-header__inner">
      <span class="site-header__mark">Data Viz Project</span>
    </div>
  `;
  header.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 12px 24px; font-size: 0.75rem; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--color-text-light); background: rgba(250,250,254,0.9);
    backdrop-filter: blur(8px); border-bottom: 1px solid var(--color-border-light);
  `;
  container.prepend(header);
}
