import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Fallback pour le développement local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Vérifier la connexion au démarrage
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Éviter les erreurs de session non trouvée
    supabase.auth.getSession().catch(() => {
      // Ignorer silencieusement l'erreur
    });
  }
});
