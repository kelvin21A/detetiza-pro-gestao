import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/types/database.types';

// Define o tipo Team baseado nos tipos gerados pelo Supabase
export type Team = Database['public']['Tables']['teams']['Row'];
export type NewTeam = Database['public']['Tables']['teams']['Insert'];
export type UpdateTeam = Database['public']['Tables']['teams']['Update'];

export function useTeam(id: string | undefined) {
  const { organizationId } = useAuth();

  const { data: team, isLoading, isError } = useQuery<Team | null>({
    queryKey: ['team', id, organizationId],
    queryFn: async () => {
      if (!id || !organizationId) return null;

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          console.warn(`Equipe com id ${id} não encontrada.`);
          return null;
        }
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!id && !!organizationId,
  });

  return { team, isLoading, isError };
}

export function useTeams() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams, isLoading, isError } = useQuery<Team[]>({ 
    queryKey: ['teams', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching teams:', error);
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: !!organizationId, // A query só é executada se o organizationId estiver disponível
  });

  const { mutateAsync: createTeam } = useMutation<Team, Error, NewTeam>({
    mutationFn: async (teamData) => {
      if (!organizationId) throw new Error('Organização não encontrada');
      const { data, error } = await supabase
        .from('teams')
        .insert({ ...teamData, organization_id: organizationId })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', organizationId] });
      toast({ description: 'Equipe criada com sucesso!' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro ao criar equipe', description: error.message });
    },
  });

  const { mutateAsync: updateTeam } = useMutation<Team, Error, { id: string; updates: UpdateTeam }>({
    mutationFn: async ({ id, updates }) => {
      if (!organizationId) throw new Error('Organização não encontrada');
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['team', variables.id] });
      toast({ description: 'Equipe atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar equipe', description: error.message });
    },
  });

  const { mutateAsync: deleteTeam } = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!organizationId) throw new Error('Organização não encontrada');
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', organizationId] });
      toast({ description: 'Equipe excluída com sucesso!' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro ao excluir equipe', description: error.message });
    },
  });

  return {
    teams,
    isLoading,
    isError,
    createTeam,
    updateTeam,
    deleteTeam,
  };
}
