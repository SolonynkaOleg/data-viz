/// <reference types="vite/client" />

declare module 'scrollama' {
  interface ScrollamaOptions {
    step: string;
    offset?: number;
    progress?: boolean;
    debug?: boolean;
    order?: boolean;
    once?: boolean;
    threshold?: number;
    parent?: HTMLElement;
  }

  interface StepCallbackResponse {
    element: HTMLElement;
    index: number;
    direction: 'up' | 'down';
  }

  interface ProgressCallbackResponse extends StepCallbackResponse {
    progress: number;
  }

  interface ScrollamaInstance {
    setup(options: ScrollamaOptions): ScrollamaInstance;
    onStepEnter(callback: (response: StepCallbackResponse) => void): ScrollamaInstance;
    onStepExit(callback: (response: StepCallbackResponse) => void): ScrollamaInstance;
    onStepProgress(callback: (response: ProgressCallbackResponse) => void): ScrollamaInstance;
    resize(): void;
    enable(): void;
    disable(): void;
    destroy(): void;
  }

  export default function scrollama(): ScrollamaInstance;
}
