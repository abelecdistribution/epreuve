import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Vérification plus détaillée des variables d'environnement
  if (typeof url !== 'string' || url.trim() === '') {
    throw new Error('VITE_SUPABASE_URL manquante ou invalide');
  }

  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error('VITE_SUPABASE_ANON_KEY manquante ou invalide');
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
