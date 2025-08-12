import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import LoadingFallback from './components/LoadingFallback'
import { FALLBACK_CONFIG } from './config/fallback'
import { initializeUpdateManager } from './utils/serviceWorkerUtils'
import './index.css'

// Log app initialization
if (FALLBACK_CONFIG.DEBUG_MODE && FALLBACK_CONFIG.ENABLE_CONSOLE_LOGS) {
  console.log('🚀 DetetizaPro initializing...', {
    version: FALLBACK_CONFIG.APP_VERSION,
    environment: FALLBACK_CONFIG.APP_ENVIRONMENT,
    timestamp: new Date().toISOString(),
    build: process.env.BUILD_TIMESTAMP || 'development'
  });
  
  // Habilita logs detalhados do Service Worker em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem('debug', 'sw:*');
  }
}

// Inicializa o gerenciamento de atualizações do Service Worker apenas em produção
if (process.env.NODE_ENV === 'production') {
  try {
    initializeUpdateManager();
    if (FALLBACK_CONFIG.DEBUG_MODE) {
      console.log('✅ Service Worker inicializado com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar Service Worker:', error);
    // Continuar mesmo se o Service Worker falhar
  }
}

// Get root element with error handling
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found!')
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f9fafb;
      color: #374151;
      text-align: center;
      padding: 20px;
    ">
      <div>
        <h1 style="color: #dc2626; margin-bottom: 16px;">Erro de Inicialização</h1>
        <p>Elemento root não encontrado. Verifique o HTML.</p>
        <button onclick="window.location.reload()" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 16px;
        ">Tentar Novamente</button>
      </div>
    </div>
  `
  throw new Error('Root element not found')
}

// Create root with error handling
try {
  const root = createRoot(rootElement)
  
  // Show loading fallback initially
  root.render(<LoadingFallback />)
  
  // Load main app with a small delay to show loading state
  setTimeout(() => {
    try {
      root.render(<App />)
      
      if (FALLBACK_CONFIG.DEBUG_MODE && FALLBACK_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('✅ DetetizaPro loaded successfully')
      }
    } catch (error) {
      console.error('❌ Error rendering main app:', error)
      root.render(
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f9fafb',
          color: '#374151',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div>
            <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Erro de Renderização</h1>
            <p>Falha ao carregar a aplicação principal.</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      )
    }
  }, 100) // Small delay to show loading state
  
} catch (error) {
  console.error('❌ Critical error during app initialization:', error)
  
  // Fallback HTML injection
  rootElement.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f9fafb;
      color: #374151;
      text-align: center;
      padding: 20px;
    ">
      <div>
        <h1 style="color: #dc2626; margin-bottom: 16px;">Erro Crítico</h1>
        <p>Falha crítica na inicialização da aplicação.</p>
        <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">Erro: ${error.message}</p>
        <button onclick="window.location.reload()" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 16px;
        ">Recarregar Página</button>
      </div>
    </div>
  `
}
