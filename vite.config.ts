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
    'process.env.VITE_SUPABASE_URL': 'import.meta.env.SUPABASE_DATABASE_URL',
    'process.env.VITE_SUPABASE_ANON_KEY': 'import.meta.env.SUPABASE_ANON_KEY',
  },
});
