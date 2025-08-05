import { useParams } from 'react-router-dom';
import { ClientForm } from '@/components/forms/ClientForm';
import { useClient } from '@/hooks/useClients';
import { Loader2 } from 'lucide-react';

const EditarCliente = () => {
  const { id } = useParams<{ id: string }>();
  const { client, isLoading, isError } = useClient(id!);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">Erro ao carregar os dados do cliente.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Editar Cliente</h1>
        <ClientForm client={client} />
      </div>
    </div>
  );
};

export default EditarCliente;
