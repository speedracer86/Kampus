import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    // The @kampus/ui library uses React.* globals without importing (its zero-dependency
    // contract); inject the import at build time rather than editing library files.
    jsxInject: `import React from 'react'`,
  },
});
