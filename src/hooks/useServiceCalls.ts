import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';

// Tipos
type ServiceCallDAO = Database['public']['Tables']['service_calls'];
export type ServiceCall = ServiceCallDAO['Row'] & {
  clients: Database['public']['Tables']['clients']['Row'] | null;
  teams: Database['public']['Tables']['teams']['Row'] | null;
};
export type NewServiceCall = ServiceCallDAO['Insert'];
export type UpdateServiceCall = ServiceCallDAO['Update'];
export type ServiceCallStatus = ServiceCall['status'];

// Função para obter o ID da organização do usuário atual
const getOrganizationId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (error || !profile?.organization_id) {
    throw new Error('Não foi possível encontrar a organização do usuário.');
  }
  return profile.organization_id;
};

// Hook
export const useServiceCalls = () => {
  const queryClient = useQueryClient();

  // 1. BUSCAR CHAMADOS (useQuery)
  const fetchServiceCalls = async (): Promise<ServiceCall[]> => {
    const organizationId = await getOrganizationId();

    const { data, error } = await supabase
      .from('service_calls')
      .select(`
        *,
        clients (*),
        teams (*)
      `)
      .eq('organization_id', organizationId)
      .order('scheduled_date', { ascending: true, nullsFirst: false });

    if (error) throw new Error(error.message);
    return data as ServiceCall[];
  };

  const { data: serviceCalls, isLoading, isError, error } = useQuery<ServiceCall[], Error>({ 
    queryKey: ['service_calls'], 
    queryFn: fetchServiceCalls 
  });

  // 2. CRIAR CHAMADO (useMutation)
  const createServiceCallMutation = useMutation(
    async (newCall: NewServiceCall) => {
      const organizationId = await getOrganizationId();
      const { data, error } = await supabase
        .from('service_calls')
        .insert([{ ...newCall, organization_id: organizationId }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['service_calls'] });
      },
    }
  );

  // 3. ATUALIZAR CHAMADO (useMutation)
  const updateServiceCallMutation = useMutation(
    async ({ id, ...updates }: UpdateServiceCall & { id: string }) => {
      const { data, error } = await supabase
        .from('service_calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['service_calls'] });
      },
    }
  );

  // 4. DELETAR CHAMADO (useMutation)
  const deleteServiceCallMutation = useMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('service_calls')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['service_calls'] });
      },
    }
  );

  return {
    serviceCalls: serviceCalls ?? [],
    isLoading,
    isError,
    error,
    createServiceCall: createServiceCallMutation.mutateAsync,
    updateServiceCall: updateServiceCallMutation.mutateAsync,
    deleteServiceCall: deleteServiceCallMutation.mutateAsync,
  };
};