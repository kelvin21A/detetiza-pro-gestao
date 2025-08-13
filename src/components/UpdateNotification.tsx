import { useState, useEffect } from 'react';
// import { onUpdateAvailable } from '../utils/serviceWorkerUtils';
import { Button } from './ui/button';
import { CheckCircle2, RefreshCw, X } from 'lucide-react';

export function UpdateNotification() {
  const [show, setShow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // useEffect(() => {
  //   // Verifica se há uma atualização disponível
  //   onUpdateAvailable(() => setShow(true));
  // }, []);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      // Recarrega a página para aplicar a atualização
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar o aplicativo:', error);
      setIsUpdating(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-shrink-0 pt-0.5">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Atualização disponível!
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Uma nova versão do aplicativo está disponível. Deseja atualizar agora?
            </p>
            <div className="mt-4 flex space-x-3">
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={isUpdating}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar Agora'
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShow(false)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Mais tarde
              </Button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setShow(false)}
            >
              <span className="sr-only">Fechar</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
