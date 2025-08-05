import { useParams } from 'react-router-dom';
import { ServiceCallForm } from '@/components/forms/ServiceCallForm';
import { useServiceCall } from '@/hooks/useServiceCalls';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function EditarChamado() {
  const { id } = useParams<{ id: string }>();
  const { serviceCall, isLoading, isError } = useServiceCall(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
     return (
        <div className="text-center py-8 text-red-500 bg-red-50 p-4 rounded-md">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">Erro ao carregar dados do chamado.</p>
        </div>
      );
  }

  if (!serviceCall) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
        <p className="font-semibold">Chamado não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar Chamado</h1>
        <p className="text-muted-foreground">Ajuste os detalhes do serviço abaixo.</p>
      </div>
      <ServiceCallForm initialData={serviceCall} />
    </div>
  );
}
