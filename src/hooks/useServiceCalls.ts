import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase.js';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/types/database.types';

// Define o tipo ServiceCall baseado no schema do DB, incluindo o nome do cliente
export type ServiceCall = Database['public']['Tables']['service_calls']['Row'] & {
  clients: {
    name: string;
  } | null;
  teams: {
    name: string;
  } | null;
};

// Define o tipo para criação de um novo chamado, omitindo campos gerados pelo DB
export type NewServiceCall = Omit<ServiceCall, 'id' | 'created_at' | 'organization_id' | 'clients'>;

// Define o tipo para atualização de um chamado, tornando todos os campos opcionais exceto o ID
export type UpdateServiceCall = Partial<Omit<Database['public']['Tables']['service_calls']['Row'], 'id' | 'created_at' | 'organization_id'>> & {
  id: string;
};

export function useServiceCall(id: string | undefined) {
  const { user } = useAuth();
  const organizationId = user?.user_metadata.organization_id;

  const { data: serviceCall, isLoading, isError } = useQuery<ServiceCall | null>({
    queryKey: ['service_call', id],
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
    enabled: !!user && !!id && !!organizationId,
  });

  return { serviceCall, isLoading, isError };
}

export const useServiceCalls = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const organizationId = user?.user_metadata.organization_id;

  const { data: serviceCalls, isLoading, isError } = useQuery({
    queryKey: ['service_calls', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('ID da organização não disponível.');

      const { data, error } = await supabase
        .from('service_calls')
        .select('*, clients ( name ), teams ( name )')
        .eq('organization_id', organizationId)
        .order('scheduled_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data as ServiceCall[];
    },
    enabled: !!organizationId,
  });

  const { mutate: createServiceCall } = useMutation({
    mutationFn: async (newCall: NewServiceCall) => {
      if (!organizationId) throw new Error('ID da organização não disponível.');
      
      const { data, error } = await supabase
        .from('service_calls')
        .insert([{ ...newCall, organization_id: organizationId }])
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({ description: 'Chamado criado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['service_calls', organizationId] });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível criar o chamado: ${error.message}` });
    },
  });

  const { mutate: updateServiceCall } = useMutation<ServiceCall, Error, { id: string; updates: Partial<NewServiceCall> }>({
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
      toast({ description: 'Chamado atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['service_calls', organizationId] });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível atualizar o chamado: ${error.message}` });
    },
  });

  const { mutate: deleteServiceCall } = useMutation({
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
      toast({ description: 'Chamado excluído com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['service_calls', organizationId] });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível excluir o chamado: ${error.message}` });
    },
  });

  return { serviceCalls, isLoading, isError, createServiceCall, updateServiceCall, deleteServiceCall };
};