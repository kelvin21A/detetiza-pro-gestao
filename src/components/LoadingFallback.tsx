import React from 'react';
import { FALLBACK_CONFIG } from '../config/fallback';

export function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {FALLBACK_CONFIG.APP_NAME}
          </h1>
          <p className="text-gray-600 mb-4">
            Sistema de Gestão para Empresas de Dedetização
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
          <p className="text-gray-500">Carregando aplicação...</p>
          
          <div className="text-xs text-gray-400 mt-6">
            Versão {FALLBACK_CONFIG.APP_VERSION} • {FALLBACK_CONFIG.APP_ENVIRONMENT}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingFallback;
