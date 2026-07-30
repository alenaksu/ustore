import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    store: 'src/store.ts',
    lit: 'src/lit.ts',
    react: 'src/react.ts',
    'plugins/index': 'src/plugins/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
