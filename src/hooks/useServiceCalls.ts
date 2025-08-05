import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/types/database.types';

// Define o tipo ServiceCall baseado no schema do DB, incluindo o nome do cliente
export type ServiceCall = Database['public']['Tables']['service_calls']['Row'] & {
  clients: { name: string } | null;
  teams: { name: string } | null;
};

// Define o tipo para criação de um novo chamado, baseado no tipo de inserção do Supabase
export type NewServiceCall = Database['public']['Tables']['service_calls']['Insert'];

// Define o tipo para atualização de um chamado
export type UpdateServiceCall = Database['public']['Tables']['service_calls']['Update'];

export function useServiceCall(id: string | undefined) {
  const { organizationId } = useAuth();

  const { data: serviceCall, isLoading, isError } = useQuery<ServiceCall | null>({
    queryKey: ['service_call', id, organizationId],
    queryFn: async () => {
      if (!id || !organizationId) return null;

      const { data, error } = await supabase
        .from('service_calls')
        .select('*, clients ( name ), teams ( name )')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(`Chamado com id ${id} não encontrado.`);
          return null;
        }
        throw new Error(error.message);
      }
      return data as ServiceCall;
    },
    enabled: !!id && !!organizationId,
  });

  return { serviceCall, isLoading, isError };
}

export const useServiceCalls = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  const { data: serviceCalls, isLoading, isError } = useQuery({
    queryKey: ['service_calls', organizationId],
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

  const { mutateAsync: createServiceCall } = useMutation({
    mutationFn: async (newCall: NewServiceCall) => {
      if (!organizationId) throw new Error('ID da organização não disponível.');
      
      const callWithDefaults = {
        ...newCall,
        organization_id: organizationId,
        status: newCall.status || 'agendado',
      };

      const { data, error } = await supabase
        .from('service_calls')
        .insert(callWithDefaults)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_calls', organizationId] });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao criar chamado', description: error.message });
    },
  });

  const { mutateAsync: updateServiceCall } = useMutation<ServiceCall, Error, { id: string; updates: UpdateServiceCall }>({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('service_calls')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select('*, clients(name), teams(name)')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_calls', organizationId] });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar chamado', description: error.message });
    },
  });

  const { mutateAsync: deleteServiceCall } = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('service_calls')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_calls', organizationId] });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao excluir chamado', description: error.message });
    },
  });

  return { serviceCalls, isLoading, isError, createServiceCall, updateServiceCall, deleteServiceCall };
};