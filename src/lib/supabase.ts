import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SESSION_CHECK_INTERVAL = 30 * 1000; // 30 secondes

const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Debug logs
  console.debug('Supabase Config:', {
    hasUrl: !!url,
    hasKey: !!key,
    urlLength: url?.length,
    keyLength: key?.length,
    mode: import.meta.env.MODE
  });
  
  // Detailed environment variables check
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

// Gestion de session
let refreshTimeout: NodeJS.Timeout;
let sessionCheckInterval: NodeJS.Timeout;

const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Erreur lors du rafraîchissement de la session:', error);
      throw error;
    }
    
    console.debug('État de la session:', {
      hasSession: !!session,
      expiresAt: session?.expires_at,
      user: session?.user?.email,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

    if (session) {
      // Refresh the session 1 minute before expiry
      const expiresIn = new Date(session.expires_at || 0).getTime() - Date.now() - 60000;
      refreshTimeout = setTimeout(refreshSession, Math.max(0, Math.min(expiresIn, REFRESH_INTERVAL)));
    }
  } catch (error) {
    console.error('Session refresh error:', error);
  }
};

// Vérification périodique de la session
const startSessionCheck = () => {
  clearInterval(sessionCheckInterval);
  
  sessionCheckInterval = setInterval(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.debug('Vérification périodique de la session:', {
        hasSession: !!session,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Erreur lors de la vérification de la session:', error);
    }
  }, SESSION_CHECK_INTERVAL);
};

// Démarrer la vérification de session
startSessionCheck();

// Gestion des changements d'état d'authentification
supabase.auth.onAuthStateChange((event, session) => {
  clearTimeout(refreshTimeout);
  
  if (event === 'SIGNED_OUT') {
    console.debug('User signed out');
  } else if (session) {
    console.debug('Session state changed:', event);
    console.debug('Session details:', {
      event,
      user: session.user.email,
      expiresAt: session.expires_at,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    refreshSession();
  }
});
