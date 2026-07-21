import './style.css';

// Import Lit and React components to register them
import './lit/App';
import { App as ReactApp } from './react/App';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { demoStore, TOTAL_CELLS } from './store';

// ----------------------------------------------------
// 1. Mount React Panel
// ----------------------------------------------------
const reactContainer = document.getElementById('react-demo')!;
createRoot(reactContainer).render(createElement(ReactApp));

// ----------------------------------------------------
// 2. Interactive DOM Hooks & State Synchronization
// ----------------------------------------------------
const chaosToggle = document.getElementById('chaos-toggle') as HTMLInputElement;
const densitySlider = document.getElementById('density-slider') as HTMLInputElement;
const densityValLabel = document.getElementById('density-val')!;
const resetBtn = document.getElementById('reset-btn')!;

const fpsLabel = document.getElementById('fps-val')!;
const mpsLabel = document.getElementById('mps-val')!;
const totalMutationsLabel = document.getElementById('total-mutations-val')!;

// Handle User Input Events -> Write directly to Storello State
chaosToggle.addEventListener('change', () => {
  demoStore.state.chaosMode = chaosToggle.checked;
});

densitySlider.addEventListener('input', () => {
  const val = parseInt(densitySlider.value, 10);
  demoStore.state.chaosDensity = val;
  densityValLabel.textContent = String(val);
});

resetBtn.addEventListener('click', () => {
  const cells = demoStore.state.grid.cells;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    cells[i].value = 0;
    cells[i].hue = 140;
  }
  demoStore.state.count = 0;
  totalMutations = 0;
  totalMutationsLabel.textContent = '0';
});

// ----------------------------------------------------
// 3. High-Frequency Chaos Loop & Time Sync
// ----------------------------------------------------
let lastTimeUpdate = Date.now();

const runTick = () => {
  const now = Date.now();

  // Sync global clock every second
  if (now - lastTimeUpdate >= 1000) {
    demoStore.state.time = now;
    lastTimeUpdate = now;
  }

  // If chaos is enabled, apply targeted high-frequency mutations to store leaves
  if (demoStore.state.chaosMode) {
    const density = demoStore.state.chaosDensity;
    const cells = demoStore.state.grid.cells;

    for (let i = 0; i < density; i++) {
      const randIndex = Math.floor(Math.random() * TOTAL_CELLS);
      const cell = cells[randIndex];
      cell.value++;
      cell.hue = (cell.hue + 8) % 360;
    }
  }

  requestAnimationFrame(runTick);
};

// Start the core engine
requestAnimationFrame(runTick);

// ----------------------------------------------------
// 4. Performance Metrology: FPS & MPS Monitors
// ----------------------------------------------------
let frameCount = 0;
let lastFpsMeasure = performance.now();

// Measure Actual Frame Rate (FPS)
const measureFps = () => {
  frameCount++;
  const now = performance.now();
  const elapsed = now - lastFpsMeasure;

  if (elapsed >= 500) {
    const fps = Math.round((frameCount * 1000) / elapsed);
    fpsLabel.textContent = String(fps);

    // Apply color indicators based on frame drop
    fpsLabel.className = 'metric-value';
    if (fps >= 55) {
      fpsLabel.classList.add('fps-good');
    } else if (fps >= 40) {
      fpsLabel.classList.add('fps-warning');
    } else {
      fpsLabel.classList.add('fps-bad');
    }

    frameCount = 0;
    lastFpsMeasure = now;
  }
  requestAnimationFrame(measureFps);
};
requestAnimationFrame(measureFps);

// Measure Mutations per Second (MPS) & Total Mutations using store.onChange callback
let mutationCountInInterval = 0;
let totalMutations = 0;
let lastMpsMeasure = performance.now();

demoStore.onChange((event) => {
  const count = event.paths.length;
  mutationCountInInterval += count;
  totalMutations += count;
  totalMutationsLabel.textContent = totalMutations.toLocaleString();
});

setInterval(() => {
  const now = performance.now();
  const elapsed = (now - lastMpsMeasure) / 1000;
  const mps = Math.round(mutationCountInInterval / elapsed);

  mpsLabel.textContent = mps.toLocaleString();

  mutationCountInInterval = 0;
  lastMpsMeasure = now;
}, 500);
