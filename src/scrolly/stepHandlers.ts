/* ──────────────────────────────────────────────
   Step handlers — maps scroll steps to state changes
   This is the core "scene system" glue.
   ────────────────────────────────────────────── */

import type { StepCallbackResponse } from 'scrollama';
import { STORY_STEPS } from '../config/story';
import { appState } from '../core/state';
import type { ChartState, SectionId } from '../data/types';

/**
 * Map from step DOM elements to story step configs.
 * We match by data-step-id attribute.
 */
function getStepConfig(element: HTMLElement) {
  const stepId = element.dataset.stepId;
  if (!stepId) return null;
  return STORY_STEPS.find(s => s.id === stepId) ?? null;
}

export function handleStepEnter(response: StepCallbackResponse): void {
  const { element, index, direction } = response;

  // Mark active step visually
  document.querySelectorAll('.step').forEach(el => el.classList.remove('is-active'));
  element.classList.add('is-active');

  // Find the matching story step config
  const stepConfig = getStepConfig(element);
  if (!stepConfig) return;

  // Update mobile floating card if present
  updateMobileCard(element, stepConfig);

  // Update app state with the step's chart state
  appState.setStep(index);
  appState.updateChart({
    ...stepConfig.chartState,
  } as Partial<ChartState>);
}

/** Sync the mobile floating card with current step content */
function updateMobileCard(
  element: HTMLElement,
  step: (typeof STORY_STEPS)[number],
): void {
  const card = document.getElementById('mobile-card');
  if (!card) return;

  const titleEl = card.querySelector<HTMLElement>('.mobile-card__title')!;
  const textEl = card.querySelector<HTMLElement>('.mobile-card__text')!;

  // If it's a section divider, show its content instead
  const dividerTitle = element.querySelector<HTMLElement>('.section-divider__title');
  if (dividerTitle) {
    const dividerNumber = element.querySelector<HTMLElement>('.section-divider__number');
    const dividerDesc = element.querySelector<HTMLElement>('.section-divider__desc');
    card.classList.add('mobile-card--divider');
    titleEl.textContent = (dividerNumber?.textContent ?? '') + ' — ' + (dividerTitle.textContent ?? '');
    textEl.textContent = dividerDesc?.textContent ?? '';
  } else {
    card.classList.remove('mobile-card--divider');
    titleEl.textContent = step.title || '';
    textEl.textContent = step.text || '';
  }

  // Show card only if there's content
  const hasContent = (titleEl.textContent?.trim() || textEl.textContent?.trim());
  card.classList.toggle('mobile-card--visible', !!hasContent);

  // Trigger fade-in animation
  card.classList.remove('mobile-card--animate');
  // Force reflow so the animation restarts
  void card.offsetWidth;
  card.classList.add('mobile-card--animate');
}

export function handleStepExit(response: StepCallbackResponse): void {
  const { element } = response;
  element.classList.remove('is-active');
}

/**
 * Determine which chart section should be visible based on active section.
 * Charts register themselves and the scene system shows/hides them.
 */
export function getActiveSectionForStep(stepIndex: number): SectionId {
  // Walk through story steps to find which section we're in
  const allSteps = STORY_STEPS.filter(s => s.section !== 'intro' && s.section !== 'conclusion');
  if (stepIndex < 0 || stepIndex >= allSteps.length) return 'global-overview';
  return allSteps[stepIndex].section;
}
