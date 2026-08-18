import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The handoff components use bare `React.useState` and no React import, so the
// library files stay byte-identical to the design handoff. jsxInject puts React
// in scope for every .jsx file instead of editing 9 files by hand.
export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  esbuild: { jsxInject: `import React from 'react'` },
});
