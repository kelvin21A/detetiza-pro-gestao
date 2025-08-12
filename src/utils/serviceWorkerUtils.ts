/**
 * Utilitários para gerenciamento do Service Worker
 */

// Tipos
type UpdateCallback = (registration: ServiceWorkerRegistration) => void;

// Estado global para callbacks de atualização
const updateCallbacks: UpdateCallback[] = [];

/**
 * Registra um callback para ser chamado quando uma nova versão estiver disponível
 */
export function onUpdateAvailable(callback: UpdateCallback) {
  updateCallbacks.push(callback);
}

/**
 * Força a atualização do Service Worker
 */
export async function forceUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não suportado neste navegador');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Envia mensagem para o Service Worker para pular a espera
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    }
    
    // Se não houver worker esperando, tenta registrar um novo
    await registration.update();
    return true;
  } catch (error) {
    console.error('Erro ao forçar atualização do Service Worker:', error);
    return false;
  }
}

/**
 * Verifica se há uma nova versão disponível
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
    return false;
  }
}

/**
 * Inicializa o gerenciamento de atualizações do Service Worker
 */
export function initializeUpdateManager() {
  // Verificar suporte a Service Worker
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não suportado neste navegador');
    return;
  }

  // Registra o service worker com tratamento de erros robusto
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Sempre verificar atualizações no servidor
      });
      
      console.log('Service Worker registrado com sucesso:', registration.scope);
      
      // Configurar detecção de atualizações
      setupUpdateDetection(registration);
      
      return registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      // Não propagar o erro para não quebrar a aplicação
      return null;
    }
  };
  
  // Configurar detecção de atualizações
  const setupUpdateDetection = (registration: ServiceWorkerRegistration) => {
    // Verificar atualizações
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('Nova versão disponível!');
          // Notifica os callbacks registrados
          updateCallbacks.forEach(callback => callback(registration));
        }
      });
    });
    
    // Verificar periodicamente por atualizações (a cada 60 minutos)
    setInterval(() => {
      registration.update().catch(err => {
        console.warn('Erro ao verificar atualizações do Service Worker:', err);
      });
    }, 60 * 60 * 1000);
  };

  // Monitora mudanças no Service Worker
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Controller mudou - recarregando para aplicar atualizações...');
    window.location.reload();
  });

  // Registrar quando a página carregar
  if (document.readyState === 'complete') {
    registerServiceWorker();
  } else {
    window.addEventListener('load', () => {
      // Pequeno atraso para priorizar o carregamento da página
      setTimeout(registerServiceWorker, 1000);
    });
  }
}

// Inicializa o gerenciador de atualizações automaticamente
if (typeof window !== 'undefined') {
  initializeUpdateManager();
}
