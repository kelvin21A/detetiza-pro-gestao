import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/types/supabase';

// Tipos para a nova tabela 'appointments'
export type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  clients: { name: string } | null;
  teams: { name: string } | null;
  estimated_duration?: number;
  address?: string;
  notes?: string;
};
type NewAppointment = Database['public']['Tables']['appointments']['Insert'];
type UpdateAppointment = Database['public']['Tables']['appointments']['Update'];

// Tipo para os dados que vêm do formulário de criação
type AppointmentFormData = Omit<NewAppointment, 'id' | 'created_at' | 'organization_id'> & {
  scheduled_time?: string; // Campo temporário usado apenas no formulário
  estimated_duration?: number;
  address?: string;
  notes?: string;
};

export const useAppointments = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const organizationId = profile?.organization_id;

  // BUSCAR TODOS OS AGENDAMENTOS
  const { data: appointments, isLoading, error } = useQuery<Appointment[], Error>({
    queryKey: ['appointments', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select('*, clients ( name ), teams ( name )')
        .eq('organization_id', organizationId)
        .order('scheduled_date', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return data as any;
    },
    enabled: !!organizationId,
  });

  // CRIAR AGENDAMENTO
  const { mutateAsync: createAppointment } = useMutation(
    async (formData: AppointmentFormData) => {
      if (!organizationId) throw new Error('Organização não encontrada.');

      // Remover o campo scheduled_time que não existe no banco de dados
      const { scheduled_time, ...restFormData } = formData;
      
      const newAppointment: NewAppointment = {
        ...restFormData,
        organization_id: organizationId,
        status: formData.status || 'scheduled',
        team_id: formData.team_id || null,
        // Garantir que os novos campos sejam incluídos
        estimated_duration: formData.estimated_duration,
        address: formData.address,
        notes: formData.notes,
      };

      const { error } = await supabase.from('appointments').insert(newAppointment);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['appointments', organizationId] });
        toast({ title: 'Sucesso!', description: 'Agendamento criado com sucesso.' });
      },
      onError: (error: Error) => {
        toast({ title: 'Erro ao criar agendamento', description: error.message, variant: 'destructive' });
      },
    }
  );

  // ATUALIZAR AGENDAMENTO
  const { mutateAsync: updateAppointment } = useMutation(
    async ({ id, updates }: { id: string; updates: UpdateAppointment }) => {
      if (!organizationId) throw new Error('Organização não encontrada.');

      // Remover o campo scheduled_time que não existe no banco de dados
      const { scheduled_time, ...restUpdates } = updates as any;
      
      // Tratar campos vazios
      if (restUpdates.team_id === '') {
        restUpdates.team_id = null;
      }

      const { error } = await supabase
        .from('appointments')
        .update(restUpdates)
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['appointments', organizationId] });
        toast({ title: 'Sucesso!', description: 'Agendamento atualizado com sucesso.' });
      },
      onError: (error: Error) => {
        toast({ title: 'Erro ao atualizar agendamento', description: error.message, variant: 'destructive' });
      },
    }
  );

  // DELETAR AGENDAMENTO
  const { mutateAsync: deleteAppointment } = useMutation(
    async (id: string) => {
      if (!organizationId) throw new Error('Organização não encontrada.');

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['appointments', organizationId] });
        toast({ title: 'Sucesso!', description: 'Agendamento deletado com sucesso.' });
      },
      onError: (error: Error) => {
        toast({ title: 'Erro ao deletar agendamento', description: error.message, variant: 'destructive' });
      },
    }
  );

  return { appointments, isLoading, error, createAppointment, updateAppointment, deleteAppointment };
};
