import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: any;
}

interface PWAHook extends PWAState {
  installApp: () => Promise<void>;
  updateApp: () => void;
  checkOnlineStatus: () => boolean;
}

export const usePWA = (): PWAHook => {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    installPrompt: null,
  });

  // Check if app is already installed
  const checkIfInstalled = useCallback(() => {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || isInWebAppiOS;
    
    setState(prev => ({ ...prev, isInstalled }));
    return isInstalled;
  }, []);

  // Install PWA
  const installApp = useCallback(async () => {
    if (state.installPrompt && (window as any).installPWA) {
      try {
        await (window as any).installPWA();
        setState(prev => ({ 
          ...prev, 
          isInstallable: false, 
          installPrompt: null 
        }));
      } catch (error) {
        console.error('Error installing PWA:', error);
      }
    }
  }, [state.installPrompt]);

  // Update app
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update();
        }
      });
    }
  }, []);

  // Check online status
  const checkOnlineStatus = useCallback(() => {
    return navigator.onLine;
  }, []);

  // Setup event listeners
  useEffect(() => {
    // PWA install prompt available
    const handleInstallAvailable = (event: any) => {
      console.log('PWA install available');
      setState(prev => ({ 
        ...prev, 
        isInstallable: true, 
        installPrompt: event.detail 
      }));
    };

    // PWA install result
    const handleInstallResult = (event: any) => {
      console.log('PWA install result:', event.detail);
      if (event.detail === 'accepted') {
        setState(prev => ({ 
          ...prev, 
          isInstalled: true, 
          isInstallable: false 
        }));
      }
    };

    // Online status change
    const handleOnline = () => {
      console.log('App went online');
      setState(prev => ({ ...prev, isOnline: true }));
      
      // Trigger background sync when coming back online
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          return registration.sync.register('sync-supabase-data');
        }).catch((error) => {
          console.error('Background sync registration failed:', error);
        });
      }
    };

    const handleOffline = () => {
      console.log('App went offline');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    // Service Worker update available
    const handleSWUpdate = () => {
      console.log('Service Worker update available');
      setState(prev => ({ ...prev, isUpdateAvailable: true }));
    };

    // Add event listeners
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-result', handleInstallResult);
    window.addEventListener('app-online', handleOnline);
    window.addEventListener('app-offline', handleOffline);
    window.addEventListener('sw-update-available', handleSWUpdate);

    // Check initial install status
    checkIfInstalled();

    // Cleanup
    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-result', handleInstallResult);
      window.removeEventListener('app-online', handleOnline);
      window.removeEventListener('app-offline', handleOffline);
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, [checkIfInstalled]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnlineChange = () => {
      setState(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);

    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, []);

  return {
    ...state,
    installApp,
    updateApp,
    checkOnlineStatus,
  };
};

// Utility functions for PWA features
export const PWAUtils = {
  // Check if PWA is supported
  isPWASupported: (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Check if running as installed PWA
  isRunningStandalone: (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  },

  // Get PWA display mode
  getDisplayMode: (): string => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    return 'browser';
  },

  // Share content using Web Share API
  shareContent: async (data: { title: string; text: string; url?: string }) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Error sharing:', error);
        return false;
      }
    }
    return false;
  },

  // Copy to clipboard
  copyToClipboard: async (text: string): Promise<boolean> => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
      }
    }
    return false;
  },

  // Get network information
  getNetworkInfo: () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return null;
  },
};
