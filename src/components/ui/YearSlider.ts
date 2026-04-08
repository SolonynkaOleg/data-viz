/* ──────────────────────────────────────────────
   Year slider — controls the displayed year
   ────────────────────────────────────────────── */

import { YEAR_RANGE } from '../../config/dimensions';
import { appState } from '../../core/state';

export class YearSlider {
  private el: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private label: HTMLElement | null = null;
  private playBtn: HTMLButtonElement | null = null;
  private animFrame: number | null = null;
  private playing = false;
  private rangeMin = YEAR_RANGE[0];
  private rangeMax = YEAR_RANGE[1];

  render(container: HTMLElement): HTMLElement {
    this.el = document.createElement('div');
    this.el.className = 'year-slider';
    this.el.id = 'year-slider';
    this.el.innerHTML = `
      <button class="year-slider__play-btn" id="play-btn" title="Play">▶</button>
      <span class="year-slider__label" id="year-label">${appState.chartState.year}</span>
      <input type="range" min="${YEAR_RANGE[0]}" max="${YEAR_RANGE[1]}" value="${appState.chartState.year}" step="1" />
    `;

    this.input = this.el.querySelector('input')!;
    this.label = this.el.querySelector('#year-label')!;
    this.playBtn = this.el.querySelector('#play-btn')!;

    this.input.addEventListener('input', () => {
      const year = parseInt(this.input!.value, 10);
      this.label!.textContent = String(year);
      appState.updateChart({ year, animating: false });
    });

    this.playBtn.addEventListener('click', () => this.togglePlay());

    container.appendChild(this.el);
    return this.el;
  }

  setYear(year: number): void {
    if (this.input) this.input.value = String(year);
    if (this.label) this.label.textContent = String(year);
  }

  private togglePlay(): void {
    this.playing = !this.playing;
    if (this.playBtn) {
      this.playBtn.textContent = this.playing ? '⏸' : '▶';
    }

    if (this.playing) {
      let year = parseInt(this.input!.value, 10);
      const step = () => {
        if (!this.playing) return;
        year++;
        if (year > this.rangeMax) {
          year = this.rangeMin;
        }
        this.setYear(year);
        appState.updateChart({ year, animating: false });
        this.animFrame = window.setTimeout(step, 300) as unknown as number;
      };
      step();
    } else {
      if (this.animFrame) clearTimeout(this.animFrame);
    }
  }

  /** Dynamically constrain the slider range (e.g. per section) */
  setRange(min: number, max: number): void {
    if (this.input) {
      this.input.min = String(min);
      this.input.max = String(max);
      // Clamp current value into new bounds
      const cur = parseInt(this.input.value, 10);
      if (cur < min) { this.input.value = String(min); this.label!.textContent = String(min); }
      if (cur > max) { this.input.value = String(max); this.label!.textContent = String(max); }
    }
    this.rangeMin = min;
    this.rangeMax = max;
  }

  show(): void {
    if (this.el) this.el.style.display = 'flex';
  }

  hide(): void {
    if (this.el) this.el.style.display = 'none';
  }

  destroy(): void {
    this.playing = false;
    if (this.animFrame) clearTimeout(this.animFrame);
    this.el?.remove();
  }
}
