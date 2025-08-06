import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ServiceCall } from '@/types';
import { Database } from '@/types/supabase';

// Tipos explícitos para criação e atualização, baseados nos tipos gerados pelo Supabase.
type NewServiceCall = Database['public']['Tables']['service_calls']['Insert'];
type UpdateServiceCall = Database['public']['Tables']['service_calls']['Update'];

// Tipo para os dados que vêm DIRETAMENTE do formulário de criação.
// Note que não inclui 'status', 'id', 'created_at', ou 'organization_id'.
type ServiceCallFormCreationData = Omit<NewServiceCall, 'id' | 'created_at' | 'organization_id' | 'status'>;

export const useServiceCalls = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const organizationId = profile?.organization_id;

  // BUSCAR TODOS OS CHAMADOS (com filtro de organização)
  const { data: serviceCalls, isLoading, error } = useQuery<ServiceCall[], Error>({
    queryKey: ['serviceCalls', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      try {
        const { data, error } = await supabase
          .from('service_calls')
          .select('*, clients ( name ), teams ( name )')
          .eq('organization_id', organizationId)
          .order('scheduled_date', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }
        return data as ServiceCall[];
      } catch (error: any) {
        console.error("Error fetching service calls:", error);
        throw new Error("Falha ao buscar os chamados. Verifique sua conexão e tente novamente.");
      }
    },
    enabled: !!organizationId,
  });

  // CRIAR CHAMADO (Reconstruído para segurança máxima)
  const { mutateAsync: createServiceCall } = useMutation(
    async (callData: ServiceCallFormCreationData) => {
      if (!organizationId) throw new Error('Organização não encontrada.');

      // 1. Construção explícita e segura do objeto a ser salvo.
      const newCall: NewServiceCall = {
        ...callData,
        team_id: callData.team_id || null, // Garante que team_id seja nulo se vazio.
        organization_id: organizationId,  // 2. Garante o ID da organização.
        status: 'pending',                // 3. Garante o status inicial como 'pending'.
      };

      const { error } = await supabase.from('service_calls').insert(newCall);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['serviceCalls', organizationId] });
        toast({ title: 'Sucesso!', description: 'Chamado criado com sucesso.' });
      },
      onError: (error: Error) => {
        toast({ title: 'Erro ao criar chamado', description: error.message, variant: 'destructive' });
      },
    }
  );

  // ATUALIZAR CHAMADO
  const { mutateAsync: updateServiceCall } = useMutation(
    async ({ id, updates }: { id: string; updates: UpdateServiceCall }) => {
      if (!organizationId) throw new Error('Organização não encontrada.');

      // Garante que team_id seja nulo se for uma string vazia.
      if (updates.team_id === '') {
        updates.team_id = null;
      }

      const { error } = await supabase
        .from('service_calls')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organizationId); // Filtro de segurança

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['serviceCalls', organizationId] });
        toast({ title: 'Sucesso!', description: 'Chamado atualizado com sucesso.' });
      },
      onError: (error: Error) => {
        toast({ title: 'Erro ao atualizar chamado', description: error.message, variant: 'destructive' });
      },
    }
  );

  // DELETAR CHAMADO
  const { mutateAsync: deleteServiceCall } = useMutation(
    async (id: string) => {
      if (!organizationId) throw new Error('Organização não encontrada.');

      const { error } = await supabase
        .from('service_calls')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId); // Filtro de segurança

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['serviceCalls', organizationId] });
        toast({ title: 'Sucesso!', description: 'Chamado deletado com sucesso.' });
      },
      onError: (error: Error) => {
        toast({ title: 'Erro ao deletar chamado', description: error.message, variant: 'destructive' });
      },
    }
  );

  return { serviceCalls, isLoading, error, createServiceCall, updateServiceCall, deleteServiceCall };
};