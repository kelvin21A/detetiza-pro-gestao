import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase.js';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '../types/database.types';

// Define o tipo Client baseado nos tipos gerados pelo Supabase
type Client = Database['public']['Tables']['clients']['Row'];

// Re-exporta o tipo Client para ser usado em outras partes da aplicação
export type { Client };

// Hook para buscar um único cliente pelo ID
export function useClient(id: string | undefined) {
  const { organizationId } = useAuth();

  const { data: client, isLoading, isError } = useQuery<Client | null>({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id || !organizationId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        // Não lançar erro se o cliente simplesmente não for encontrado
        if (error.code === 'PGRST116') {
          console.warn(`Cliente com id ${id} não encontrado.`);
          return null;
        }
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!organizationId && !!id, // A query só é executada se a organização e o ID existirem
  });

  return { client, isLoading, isError };
}

export function useClients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  // Query para buscar todos os clientes da organização
  const { data: clients, isLoading, isError } = useQuery<Client[]>({
    queryKey: ['clients', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!organizationId, // A query só é executada se a organização existir
  });

  // Mutation para criar um novo cliente
  const { mutateAsync: createClient } = useMutation({
    mutationFn: async (clientData: Omit<Client, 'id' | 'created_at' | 'organization_id'>) => {
      if (!organizationId) {
        throw new Error('Organização não encontrada para este usuário.');
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, organization_id: organizationId }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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

  // Mutation para atualizar um cliente
  const { mutateAsync: updateClient } = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      if (!organizationId) throw new Error('Organização não encontrada.');

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organizationId) // Garante que só pode atualizar cliente da própria org
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', updatedClient.id] });
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

  // Mutation para deletar um cliente
  const { mutateAsync: deleteClient } = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error('Organização não encontrada.');

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId); // Garante que só pode deletar cliente da própria org

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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