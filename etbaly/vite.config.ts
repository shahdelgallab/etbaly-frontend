import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Raise the chunk-size warning threshold slightly for Three.js bundles
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'three-vendor';
            if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
            if (id.includes('framer-motion') || id.includes('lucide-react')) return 'ui-vendor';
          }
        },
      },
    },
  },
});
