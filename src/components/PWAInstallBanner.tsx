import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWA, PWAUtils } from '@/hooks/usePWA';

interface PWAInstallBannerProps {
  className?: string;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Show banner if installable and not dismissed
    if (isInstallable && !isDismissed && !isInstalled) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isInstallable, isDismissed, isInstalled]);

  const handleInstall = async () => {
    try {
      await installApp();
      setIsVisible(false);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <Card className={`fixed bottom-4 left-4 right-4 z-50 border-red-200 bg-white shadow-lg md:left-auto md:right-4 md:w-96 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Download className="h-5 w-5 text-red-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Instalar DetetizaPro
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Instale o app para acesso rápido e funcionalidades offline
            </p>
            
            <div className="mt-3 flex items-center gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Download className="h-3 w-3 mr-1" />
                Instalar
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                Agora não
              </Button>
            </div>
            
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                <span>Mobile</span>
              </div>
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                <span>Desktop</span>
              </div>
              {!isOnline && (
                <div className="flex items-center gap-1 text-orange-600">
                  <div className="h-2 w-2 rounded-full bg-orange-600" />
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

// PWA Status Indicator Component
export const PWAStatusIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstalled, isOnline, isUpdateAvailable } = usePWA();
  const displayMode = PWAUtils.getDisplayMode();

  if (!isInstalled && displayMode === 'browser') {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {isInstalled && (
        <div className="flex items-center gap-1 text-green-600">
          <div className="h-2 w-2 rounded-full bg-green-600" />
          <span>App Instalado</span>
        </div>
      )}
      
      <div className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
        <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-600' : 'bg-orange-600'}`} />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
      
      {isUpdateAvailable && (
        <div className="flex items-center gap-1 text-blue-600">
          <div className="h-2 w-2 rounded-full bg-blue-600" />
          <span>Atualização disponível</span>
        </div>
      )}
    </div>
  );
};

// PWA Update Banner Component
export const PWAUpdateBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isUpdateAvailable, updateApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(isUpdateAvailable);
  }, [isUpdateAvailable]);

  const handleUpdate = () => {
    updateApp();
    setIsVisible(false);
    // Reload page after a short delay to allow SW to update
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className={`fixed top-4 left-4 right-4 z-50 border-blue-200 bg-white shadow-lg md:left-auto md:right-4 md:w-96 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Atualização Disponível
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Uma nova versão do DetetizaPro está disponível
            </p>
            
            <div className="mt-3 flex items-center gap-2">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Atualizar Agora
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                Depois
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
