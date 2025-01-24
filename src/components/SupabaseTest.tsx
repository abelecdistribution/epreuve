import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, XCircle, Database, ChevronDown } from 'lucide-react';

const SupabaseTest = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<{
    quizCount?: number;
    submissionCount?: number;
    pastWinnersCount?: number;
  }>({});
  const [showDetails, setShowDetails] = useState(false);
  const [rlsStatus, setRlsStatus] = useState<{[key: string]: boolean}>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    checkConnection();
    // Rafraîchir les données toutes les minutes
    const refreshInterval = setInterval(checkConnection, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  const testRLSPermissions = async () => {
    const tables = ['quizzes', 'submissions', 'admins'];
    const permissions: {[key: string]: boolean} = {};
    
    for (const table of tables) {
      try {
        console.debug(`Testing RLS for ${table}...`);
        const { data, error, status } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        console.debug(`RLS test result for ${table}:`, {
          success: !error,
          status,
          error: error?.message,
          data
        });
        
        permissions[table] = !error;
      } catch (err) {
        console.error(`RLS test failed for ${table}:`, err);
        permissions[table] = false;
      }
    }
    
    setRlsStatus(permissions);
    return permissions;
  };

  const logDeviceInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: navigator.connection ? {
        type: (navigator.connection as any).effectiveType,
        downlink: (navigator.connection as any).downlink
      } : 'not available'
    };
    console.debug('Device Info:', info);
  };

  const checkConnection = async () => {
    try {
      logDeviceInfo();
      await testRLSPermissions();

      // Vérifier la connexion de base
      console.debug('Vérification de la connexion Supabase...', {
        url: import.meta.env.VITE_SUPABASE_URL?.substring(0, 10) + '...',
        keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...',
        mode: import.meta.env.MODE,
        prod: import.meta.env.PROD,
        timestamp: new Date().toISOString()
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      console.debug('Auth User:', user ? 'Authenticated' : 'Not authenticated');

      // Récupérer les statistiques
      const [quizzesResponse, submissionsResponse, winnersResponse] = await Promise.all([
        supabase
          .from('quizzes')
          .select('*')
          .options({
            head: false,
            count: 'exact'
          })
          .order('created_at', { ascending: false }),
        supabase
          .from('submissions')
          .select('*')
          .options({
            head: false,
            count: 'exact'
          })
          .order('created_at', { ascending: false }),
        supabase.from('quizzes')
          .select('drawn_winner_email')
          .options({
            head: false,
            count: 'exact'
          })
          .not('drawn_winner_email', 'is', null)
      ]);
      
      // Log détaillé des réponses
      console.debug('Réponses détaillées:', {
        quizzes: {
          data: quizzesResponse.data,
          error: quizzesResponse.error,
          status: quizzesResponse.status,
          statusText: quizzesResponse.statusText
        },
        submissions: {
          data: submissionsResponse.data,
          error: submissionsResponse.error,
          status: submissionsResponse.status,
          statusText: submissionsResponse.statusText
        },
        winners: {
          data: winnersResponse.data,
          error: winnersResponse.error,
          status: winnersResponse.status,
          statusText: winnersResponse.statusText
        }
      });

      if (quizzesResponse.error) throw quizzesResponse.error;
      if (submissionsResponse.error) throw submissionsResponse.error;
      if (winnersResponse.error) throw winnersResponse.error;

      // Vérifier si les données sont bien des tableaux
      const quizzes = Array.isArray(quizzesResponse.data) ? quizzesResponse.data : [];
      const submissions = Array.isArray(submissionsResponse.data) ? submissionsResponse.data : [];
      const winners = Array.isArray(winnersResponse.data) ? winnersResponse.data : [];

      console.debug('Données traitées:', {
        quizCount: quizzes.length,
        submissionCount: submissions.length,
        winnerCount: winners.length,
        timestamp: new Date().toISOString()
      });

      setDetails({
        quizCount: quizzes.length,
        submissionCount: submissions.length,
        pastWinnersCount: winners.length
      });
      setLastRefresh(new Date());

      setStatus('connected');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      // Ajouter des détails de diagnostic
      const details = {
        message: err.message,
        code: err.code,
        hint: err.hint,
        details: err.details,
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        isProd: import.meta.env.PROD
      };
      console.debug('Détails de l\'erreur:', details);
      
      const errorMessage = err.message.includes('VITE_SUPABASE')
        ? `Variable d'environnement manquante: ${err.message}`
        : `Erreur de connexion: ${err.message} (${err.code || 'unknown'})`;
      setStatus('error');
      setError(errorMessage);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-white rounded-lg shadow-lg z-50">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
          <Database className="w-5 h-5 text-blue-500" />
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
          <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </div>
        
        {lastRefresh && (
          <div className="text-xs text-gray-400 mt-1">
            Dernière mise à jour: {lastRefresh.toLocaleTimeString()}
          </div>
        )}

        {showDetails && status === 'connected' && (
          <div className="mt-2 text-sm border-t pt-2">
            <div className="mb-2 pb-2 border-b border-gray-200">
              <div className="text-xs font-medium text-gray-500 mb-1">Permissions RLS:</div>
              {Object.entries(rlsStatus).map(([table, hasAccess]) => (
                <div key={table} className="flex items-center justify-between">
                  <span className="text-gray-600">{table}:</span>
                  <span className={`text-xs ${hasAccess ? 'text-green-500' : 'text-red-500'}`}>
                    {hasAccess ? 'Accès OK' : 'Pas d\'accès'}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Quiz créés:</span>
                <span className="font-medium">{details.quizCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Participations:</span>
                <span className="font-medium">{details.submissionCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gagnants tirés:</span>
                <span className="font-medium">{details.pastWinnersCount}</span>
              </div>
            </div>
            {(details.quizCount === 0 && details.submissionCount === 0) && (
              <p className="text-xs text-red-500 mt-2">
                Aucune donnée trouvée. Vérifiez les variables d'environnement Supabase.
              </p>
            )}
            <button
              onClick={() => {
                checkConnection();
                toast.success('Données rafraîchies');
              }}
              className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Rafraîchir les données
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseTest;
