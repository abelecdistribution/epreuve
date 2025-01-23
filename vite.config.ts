import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
        // Empêcher l'inclusion des variables d'environnement dans le build
        inlineDynamicImports: false,
      },
    },
  },
  // Définir les variables d'environnement comme externes
  define: {
    // Ne pas redéfinir les variables d'environnement, laisser Vite les gérer
  },
});
