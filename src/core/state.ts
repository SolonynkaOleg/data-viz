/* ──────────────────────────────────────────────
   Centralized application state
   Single source of truth for what the UI shows
   ────────────────────────────────────────────── */

import type { ChartState, CountryYearRecord, ConflictEvent } from '../data/types';
import { YEAR_RANGE } from '../config/dimensions';
import { eventBus } from './eventBus';

/** Default chart state */
function defaultChartState(): ChartState {
  return {
    activeSection: 'intro',
    year: YEAR_RANGE[1],
    yearRange: [...YEAR_RANGE],
    selectedCountries: [],
    highlightRegion: null,
    animating: false,
    transitionYears: [2000, 2020],
  };
}

class AppState {
  chartState: ChartState = defaultChartState();
  data: CountryYearRecord[] = [];
  conflictEvents: ConflictEvent[] = [];
  currentStepIndex = 0;

  /** Merge partial updates into chart state and notify listeners */
  updateChart(partial: Partial<ChartState>): void {
    this.chartState = { ...this.chartState, ...partial };
    eventBus.emit('stateChange', this.chartState);
  }

  /** Set the dataset (called once at init) */
  setData(records: CountryYearRecord[]): void {
    this.data = records;
  }

  setConflictEvents(events: ConflictEvent[]): void {
    this.conflictEvents = events;
  }

  setStep(index: number): void {
    this.currentStepIndex = index;
    eventBus.emit('stepChange', index);
  }

  reset(): void {
    this.chartState = defaultChartState();
    this.currentStepIndex = 0;
  }
}

/** Singleton */
export const appState = new AppState();
