import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isResetMode) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/login`,
        });
        
        if (error) throw error;
        
        toast.success('Instructions envoyées par email');
        setIsResetMode(false);
      } catch (error) {
        console.error('Error resetting password:', error);
        toast.error('Erreur lors de la réinitialisation');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        toast.error('Accès non autorisé. Seuls les administrateurs peuvent se connecter.');
        return;
      }

      navigate('/admin');
      toast.success('Connexion réussie');
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : 'Erreur de connexion'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsResetMode(false);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isResetMode ? 'Réinitialisation du mot de passe' : 'Connexion Administrateur'}
          </h2>
          <h2 className="mt-2 text-center text-sm text-gray-600">
            {isResetMode && 'Entrez votre email pour recevoir un lien de réinitialisation'}
            {!isResetMode && 'Connectez-vous pour gérer le quiz'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Adresse email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
              />
            </div>
            {!isResetMode && <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
              />
            </div>}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              ) : (
                isResetMode ? 'Envoyer les instructions' : 'Se connecter'
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            {isResetMode ? (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour à la connexion
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsResetMode(true)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Mot de passe oublié ?
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminLogin;