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
    // Log detalhado para debugging em produção
    console.error('🚨 DetetizaPro Error Boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Em produção, enviar erro para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrar com Sentry, LogRocket ou similar
      this.reportError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Implementar envio de erro para serviço de monitoramento
    try {
      // Exemplo: Sentry.captureException(error, { extra: errorInfo });
      console.log('Error reported to monitoring service');
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleReload = () => {
    // Limpar localStorage se necessário
    try {
      // Manter apenas dados essenciais
      const authData = localStorage.getItem('auth-storage');
      localStorage.clear();
      if (authData) {
        localStorage.setItem('auth-storage', authData);
      }
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen flex items-center justify-center bg-white"
          style={{ minHeight: '100vh' }}
        >
          <div className="text-center max-w-md mx-auto p-8">
            {/* Logo/Branding */}
            <div className="mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-black mb-2">
                DetetizaPro
              </h1>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">
                Oops! Algo deu errado
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
