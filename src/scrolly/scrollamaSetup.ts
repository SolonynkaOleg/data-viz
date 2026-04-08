/* ──────────────────────────────────────────────
   Scrollama setup
   Initializes the scroll-driven step detection
   ────────────────────────────────────────────── */

import scrollama from 'scrollama';
import type { StepCallbackResponse } from 'scrollama';
import { handleStepEnter, handleStepExit } from './stepHandlers';

let instance: ReturnType<typeof scrollama> | null = null;

export function initScrollama(stepSelector: string): void {
  instance = scrollama();

  instance
    .setup({
      step: stepSelector,
      offset: 0.5,
      progress: false,
      debug: false,
    })
    .onStepEnter((response: StepCallbackResponse) => {
      handleStepEnter(response);
    })
    .onStepExit((response: StepCallbackResponse) => {
      handleStepExit(response);
    });
}

export function resizeScrollama(): void {
  instance?.resize();
}

export function destroyScrollama(): void {
  instance?.destroy();
  instance = null;
}
