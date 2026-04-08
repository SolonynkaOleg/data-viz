/* ──────────────────────────────────────────────
   Country search / select component
   ────────────────────────────────────────────── */

import { appState } from '../../core/state';
import type { CountryYearRecord } from '../../data/types';
import { getCountryList } from '../../data/dataTransform';

export class CountrySelect {
  private el: HTMLElement | null = null;

  render(container: HTMLElement, data: CountryYearRecord[]): HTMLElement {
    const countries = getCountryList(data);

    this.el = document.createElement('div');
    this.el.className = 'country-search';
    this.el.id = 'country-search';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search country…';

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      if (!query) {
        appState.updateChart({ selectedCountries: [] });
        return;
      }
      const matches = countries
        .filter(c =>
          c.country.toLowerCase().includes(query) ||
          c.iso3.toLowerCase().includes(query)
        )
        .map(c => c.iso3);
      appState.updateChart({ selectedCountries: matches });
    });

    this.el.appendChild(input);
    container.appendChild(this.el);
    return this.el;
  }

  show(): void {
    if (this.el) this.el.style.display = 'block';
  }

  hide(): void {
    if (this.el) this.el.style.display = 'none';
  }

  destroy(): void {
    this.el?.remove();
  }
}
