import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { ClientForm } from '@/components/forms/ClientForm';
import { useClient } from '@/hooks/useClients';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function EditarCliente() {
  const { id } = useParams<{ id: string }>();
  const { client, isLoading, isError } = useClient(id);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-12 bg-red-50 p-6 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar dados do cliente</h3>
          <p className="text-red-700">Não foi possível buscar os dados. Tente novamente mais tarde.</p>
        </div>
      );
    }

    if (!client) {
      return (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Cliente não encontrado</h3>
          <p className="text-muted-foreground">O cliente que você está tentando editar não foi encontrado.</p>
        </div>
      );
    }

    return <ClientForm initialData={client} />;
  };

  return (
    <AppLayout title="Editar Cliente">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-red-600">Editar Cliente</h2>
        </div>
        <div className="p-8 bg-white rounded-lg shadow-md">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
}
