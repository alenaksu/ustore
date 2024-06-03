import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    store: 'src/store.ts',
    lit: 'src/lit.ts',
    react: 'src/react.ts',
  },
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  dts: true,
});
