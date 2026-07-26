import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export const webCodeSplitting = {
  groups: [
    {
      name: 'react',
      test: /[\\/]node_modules[\\/](?:react|react-dom)[\\/]/,
      priority: 30,
      includeDependenciesRecursively: false,
    },
    {
      name: 'pixi',
      test: /[\\/]node_modules[\\/](?:@pixi|pixi\.js)[\\/]/,
      priority: 20,
      entriesAware: false,
      includeDependenciesRecursively: false,
    },
    {
      name: 'prototypes',
      test: /[\\/]apps[\\/]web[\\/]src[\\/](?:system-breaker|legacy|game-session|expedition)[\\/]/,
      priority: 10,
      entriesAware: true,
      includeDependenciesRecursively: false,
    },
  ],
};

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: webCodeSplitting,
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
