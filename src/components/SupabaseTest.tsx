import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const SupabaseTest = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('count')
        .limit(1);

      if (error) throw error;
      setStatus('connected');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2">
        {status === 'checking' && (
          <>
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-sm text-gray-600">Vérification de la connexion...</span>
          </>
        )}
        {status === 'connected' && (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Connecté à Supabase</span>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-600">Erreur de connexion</span>
            {error && (
              <span className="text-xs text-red-500 block">{error}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SupabaseTest;
