import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/types/database.types';

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type UpdateOrganization = Database['public']['Tables']['organizations']['Update'];

export function useOrganization() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ['organization', organizationId];

  const { data: organization, isLoading, isError, error } = useQuery<Organization | null>({
    queryKey,
    queryFn: async () => {
      if (!organizationId) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!organizationId,
  });

  const { mutateAsync: updateOrganization, isPending: isUpdating } = useMutation({
    mutationFn: async (updates: UpdateOrganization) => {
      if (!organizationId) throw new Error('Organização não encontrada para atualização.');

      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organizationId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({ description: 'Organização atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar organização', description: error.message });
    },
  });

  return { organization, isLoading, isError, error, updateOrganization, isUpdating };
}
