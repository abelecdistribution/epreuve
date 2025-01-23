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

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Vérifier la connexion de base
      console.debug('Vérification de la connexion Supabase...');
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('quizzes').select('count');

      if (error) {
        console.debug('Erreur lors de la requête:', error);
        throw error;
      }

      // Récupérer les statistiques
      const [quizzes, submissions, winners] = await Promise.all([
        supabase.from('quizzes').select('count'),
        supabase.from('submissions').select('count'),
        supabase.from('quizzes')
          .select('drawn_winner_email')
          .not('drawn_winner_email', 'is', null)
      ]);

      setDetails({
        quizCount: quizzes.count || 0,
        submissionCount: submissions.count || 0,
        pastWinnersCount: winners.data?.length || 0
      });

      setStatus('connected');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      // Ajouter plus de détails dans l'erreur
      const details = {
        message: err.message,
        code: err.code,
        hint: err.hint,
        details: err.details
      };
      console.debug('Détails de l\'erreur:', details);
      
      const errorMessage = err.message.includes('VITE_SUPABASE')
        ? `Variable manquante: ${err.message}`
        : `Erreur de connexion: ${err.message}`;
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

        {showDetails && status === 'connected' && (
          <div className="mt-2 text-sm border-t pt-2">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseTest;
