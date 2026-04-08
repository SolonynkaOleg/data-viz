/* ──────────────────────────────────────────────
   Entry point
   ────────────────────────────────────────────── */

import './styles/reset.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/charts.css';

import { initApp } from './app';

document.addEventListener('DOMContentLoaded', () => {
  initApp().catch(err => {
    console.error('Failed to initialize app:', err);
  });
});
