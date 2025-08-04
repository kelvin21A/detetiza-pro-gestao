import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { useAuth } from '@/contexts/AuthContext';

// Define o tipo para um único cliente, baseado nos tipos gerados do DB
type Client = Database['public']['Tables']['clients']['Row'];
type NewClient = Database['public']['Tables']['clients']['Insert'];
type UpdateClient = Database['public']['Tables']['clients']['Update'];

// Chave de query para o React Query
const CLIENTS_QUERY_KEY = 'clients';

// Função para buscar o ID da organização do usuário logado
const getOrganizationId = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    throw new Error('Organização não encontrada para o usuário.');
  }
  return profile.organization_id;
};

export function useClients() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Hook para buscar a lista de clientes (READ)
  const { data: clients, isLoading, error } = useQuery<Client[], Error>({
    queryKey: [CLIENTS_QUERY_KEY],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      const organizationId = await getOrganizationId(user.id);

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user, // A query só será executada se o usuário estiver logado
  });

  // Hook para criar um novo cliente (CREATE)
  const { mutate: createClient } = useMutation({
    mutationFn: async (newClient: Omit<NewClient, 'organization_id'>) => {
      if (!user) throw new Error('Usuário não autenticado.');
      const organizationId = await getOrganizationId(user.id);

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...newClient, organization_id: organizationId }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalida o cache e busca os dados novamente para atualizar a lista
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] });
    },
  });

  // Hook para atualizar um cliente (UPDATE)
  const { mutate: updateClient } = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateClient & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] });
    },
  });

  // Hook para deletar um cliente (DELETE)
  const { mutate: deleteClient } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] });
    },
  });

  return {
    clients: clients ?? [],
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
  };
}