import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Configuration des timeouts et intervalles
const CONFIG = {
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  SESSION_CHECK_INTERVAL: 30 * 1000, // 30 secondes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Logs de configuration détaillés
  console.debug('Supabase Config:', {
    hasUrl: !!url,
    hasKey: !!key,
    urlLength: url?.length,
    keyLength: key?.length,
    mode: import.meta.env.MODE,
    timestamp: new Date().toISOString()
  });
  
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

// Variables pour la gestion de session
let refreshTimeout: NodeJS.Timeout;
let sessionCheckInterval: NodeJS.Timeout;
let retryCount = 0;

// Fonction utilitaire pour le retry avec délai exponentiel
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  attempt = 0
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= CONFIG.RETRY_ATTEMPTS) throw error;
    
    const delay = Math.min(
      CONFIG.RETRY_DELAY * Math.pow(2, attempt),
      10000
    );
    
    console.debug(`Retry attempt ${attempt + 1}/${CONFIG.RETRY_ATTEMPTS} after ${delay}ms`);
    await wait(delay);
    
    return retryWithBackoff(fn, attempt + 1);
  }
};

const refreshSession = async () => {
  try {
    const { data: { session }, error } = await retryWithBackoff(() => 
      supabase.auth.getSession()
    );

    if (error) {
      console.error('Erreur lors du rafraîchissement de la session:', error);
      throw error;
    }
    
    console.debug('Session refreshed:', {
      hasSession: !!session,
      expiresAt: session?.expires_at,
      user: session?.user?.email,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      retryCount
    });

    if (session) {
      const expiresIn = new Date(session.expires_at || 0).getTime() - Date.now() - 60000;
      refreshTimeout = setTimeout(refreshSession, Math.max(0, Math.min(expiresIn, CONFIG.REFRESH_INTERVAL)));
    }
    
    retryCount = 0; // Reset retry count on success
  } catch (error) {
    console.error('Session refresh error:', error);
    retryCount++;
  }
};

const startSessionCheck = () => {
  clearInterval(sessionCheckInterval);
  
  sessionCheckInterval = setInterval(async () => {
    try {
      const { data: { session } } = await retryWithBackoff(() =>
        supabase.auth.getSession()
      );

      console.debug('Vérification périodique de la session:', {
        hasSession: !!session,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        retryCount
      });
    } catch (error) {
      console.error('Erreur lors de la vérification de la session:', error);
    }
  }, CONFIG.SESSION_CHECK_INTERVAL);
};

// Initialisation
startSessionCheck();

// Event listeners pour l'état d'authentification
supabase.auth.onAuthStateChange((event, session) => {
  clearTimeout(refreshTimeout);
  
  if (event === 'SIGNED_OUT') {
    console.debug('Déconnexion utilisateur', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  } else if (session) {
    console.debug('Changement d\'état de session:', {
      event,
      user: session.user.email,
      expiresAt: session.expires_at,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      retryCount
    });
    refreshSession();
  }
});
