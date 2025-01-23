import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return { url, key };
};

const { url, key } = getSupabaseConfig();
export const supabase = createClient<Database>(url, key);

// Vérifier la connexion au démarrage
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Éviter les erreurs de session non trouvée
    supabase.auth.getSession().catch(() => {
      // Ignorer silencieusement l'erreur
    });
  }
});
