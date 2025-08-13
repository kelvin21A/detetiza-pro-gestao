import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/types/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ['profile', user?.id];

  const { data: profile, isLoading, isError, error } = useQuery<Profile | null>({
    queryKey,
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Não tratar 'not found' como um erro que quebra a aplicação
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user,
  });

  const { mutateAsync: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (updates: UpdateProfile) => {
      if (!profile) throw new Error('Perfil não encontrado para atualização.');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ description: 'Perfil atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar perfil', description: error.message });
    },
  });

  return { profile, isLoading, isError, error, updateProfile, isUpdating };
}
