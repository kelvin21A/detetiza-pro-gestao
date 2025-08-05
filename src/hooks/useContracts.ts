import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/types/database.types';

// Define o tipo Contract, incluindo os dados do cliente
export type Contract = Database['public']['Tables']['contracts']['Row'] & {
  clients: Pick<Database['public']['Tables']['clients']['Row'], 'name' | 'email' | 'phone' | 'address'> | null;
};

export type UpdateContract = Database['public']['Tables']['contracts']['Update'];

export function useContracts() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts, isLoading, isError } = useQuery<Contract[]>({ 
    queryKey: ['contracts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (name, email, phone, address)
        `)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Erro ao buscar contratos:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!organizationId,
  });

  const { mutateAsync: updateContract } = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateContract }) => {
      if (!organizationId) throw new Error('Organização não encontrada');

      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', organizationId] });
      toast({ description: 'Contrato atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar contrato', description: error.message });
    },
  });

  return {
    contracts,
    isLoading,
    isError,
    updateContract,
  };
}
