import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/types/database.types';

// Tipos baseados diretamente na tabela do Supabase para consistência
export type Client = Database['public']['Tables']['clients']['Row'];
export type NewClient = Database['public']['Tables']['clients']['Insert'];
export type UpdateClient = Database['public']['Tables']['clients']['Update'];

// Hook para buscar um único cliente pelo ID
export function useClient(id: string | undefined) {
  const { organizationId } = useAuth();

  const { data: client, isLoading, isError } = useQuery<Client | null>({
    queryKey: ['client', id, organizationId],
    queryFn: async () => {
      if (!id || !organizationId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(`Cliente com id ${id} não encontrado.`);
          return null;
        }
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!organizationId && !!id,
  });

  return { client, isLoading, isError };
}

export function useClients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  const { data: clients, isLoading, isError } = useQuery<Client[]>({
    queryKey: ['clients', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!organizationId,
  });

  const { mutateAsync: createClient } = useMutation<Client, Error, NewClient>({
    mutationFn: async (clientData) => {
      if (!organizationId) {
        throw new Error('Organização não encontrada para este usuário.');
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({ ...clientData, organization_id: organizationId })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients', organizationId] });
      toast({
        title: 'Cliente criado com sucesso!',
        description: `Cliente ${newClient.name} foi adicionado.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const { mutateAsync: updateClient } = useMutation<Client, Error, { id: string; updates: UpdateClient }>({
    mutationFn: async ({ id, updates }) => {
      if (!organizationId) throw new Error('Organização não encontrada.');

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['client', updatedClient.id, organizationId] });
      toast({
        title: 'Cliente atualizado com sucesso!',
        description: `Cliente ${updatedClient.name} foi atualizado.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const { mutateAsync: deleteClient } = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!organizationId) throw new Error('Organização não encontrada.');

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', organizationId] });
      toast({
        title: 'Cliente removido com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    clients,
    isLoading,
    isError,
    createClient,
    updateClient,
    deleteClient,
  };
}