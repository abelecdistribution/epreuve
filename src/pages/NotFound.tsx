import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-[#ca231c]" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page introuvable</h1>
        <p className="text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#ca231c] hover:bg-[#b01e18] transition-colors duration-200"
          >
            <Home className="w-5 h-5 mr-2" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;