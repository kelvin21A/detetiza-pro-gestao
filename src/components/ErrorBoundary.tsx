import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FALLBACK_CONFIG, isValidConfig } from '../config/fallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {FALLBACK_CONFIG.APP_NAME}
              </h1>
              <h2 className="text-lg font-semibold text-red-600 mb-4">
                Erro de Configuração
              </h2>
            </div>

            <div className="text-left space-y-3 mb-6">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Problema:</strong> A aplicação não pôde ser carregada corretamente.
                </p>
              </div>

              {!isValidConfig() && (
                <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-800">
                    <strong>Configuração Supabase:</strong> Variáveis de ambiente não configuradas.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Ambiente:</strong> {FALLBACK_CONFIG.APP_ENVIRONMENT}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Versão:</strong> {FALLBACK_CONFIG.APP_VERSION}
                </p>
              </div>

              {FALLBACK_CONFIG.DEBUG_MODE && this.state.error && (
                <div className="bg-red-50 p-3 rounded text-left">
                  <p className="text-xs text-red-800 font-mono">
                    <strong>Erro:</strong> {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">
                        Detalhes técnicos
                      </summary>
                      <pre className="text-xs text-red-800 mt-1 overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>

              <button
                onClick={() => {
                  // Clear all caches and reload
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => caches.delete(name));
                    }).then(() => window.location.reload());
                  } else {
                    window.location.reload();
                  }
                }}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Limpar Cache e Recarregar
              </button>

              <div className="text-xs text-gray-500 mt-4">
                Se o problema persistir, entre em contato com o suporte técnico.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
