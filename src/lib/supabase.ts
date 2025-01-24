import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

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

// Session management
let refreshTimeout: NodeJS.Timeout;

const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (session) {
      // Refresh the session 1 minute before expiry
      const expiresIn = new Date(session.expires_at || 0).getTime() - Date.now() - 60000;
      refreshTimeout = setTimeout(refreshSession, Math.max(0, Math.min(expiresIn, REFRESH_INTERVAL)));
    }
  } catch (error) {
    console.error('Session refresh error:', error);
  }
};

supabase.auth.onAuthStateChange((event, session) => {
  clearTimeout(refreshTimeout);
  
  if (event === 'SIGNED_OUT') {
    console.debug('User signed out');
  } else if (session) {
    console.debug('Session state changed:', event);
    refreshSession();
  }
});
