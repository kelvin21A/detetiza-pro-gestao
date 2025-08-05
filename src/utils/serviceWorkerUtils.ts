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
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // Monitora mudanças no Service Worker
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Controller mudou - recarregando para aplicar atualizações...');
    window.location.reload();
  });

  // Verifica se há uma nova versão disponível a cada 5 minutos
  setInterval(checkForUpdates, 5 * 60 * 1000);
}

// Inicializa o gerenciador de atualizações automaticamente
if (typeof window !== 'undefined') {
  initializeUpdateManager();
}
