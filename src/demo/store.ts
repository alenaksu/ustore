import { createStore } from '../store';

export interface CellData {
  value: number;
  hue: number;
}

export interface DemoState {
  time: number;
  count: number;
  fps: number;
  mps: number;
  totalMutations: number;
  chaosMode: boolean;
  chaosDensity: number;
  grid: {
    cells: CellData[];
  };
}

export const ROWS = 15;
export const COLS = 15;
export const TOTAL_CELLS = ROWS * COLS;

const cells: CellData[] = [];
for (let i = 0; i < TOTAL_CELLS; i++) {
  cells.push({ value: 0, hue: 140 }); // Starts with cool emerald green/teal hue
}

export const demoStore = createStore<DemoState>({
  time: Date.now(),
  count: 0,
  fps: 60,
  mps: 0,
  totalMutations: 0,
  chaosMode: false,
  chaosDensity: 15,
  grid: {
    cells,
  },
});
