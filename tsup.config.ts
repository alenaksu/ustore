import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/store.ts',
    'src/lit.ts',
    'src/react.ts',
    'src/plugins/index.ts',
    'src/plugins/history.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
