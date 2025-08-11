import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { addHours, format, isWithinInterval, parseISO } from 'date-fns';

// Tipo para o resultado da verificação de disponibilidade
export type AvailabilityResult = {
  available: boolean;
  message?: string;
  conflictingAppointments?: any[];
};

/**
 * Hook para verificar a disponibilidade de uma equipe em um determinado horário
 */
export const useTeamAvailability = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  /**
   * Verifica se uma equipe está disponível em um determinado horário
   * @param teamId ID da equipe
   * @param date Data do agendamento
   * @param time Hora do agendamento (formato HH:MM)
   * @param duration Duração estimada em horas
   * @param currentAppointmentId ID do agendamento atual (para ignorar em caso de edição)
   * @returns Objeto com o resultado da verificação
   */
  const checkTeamAvailability = async (
    teamId: string,
    date: Date,
    time: string,
    duration: number = 1,
    currentAppointmentId?: string
  ): Promise<AvailabilityResult> => {
    if (!teamId || !organizationId) {
      return { available: true };
    }

    try {
      // Converter data e hora para um objeto Date
      const [hours, minutes] = time.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      // Calcular o horário de término com base na duração
      const endDateTime = addHours(startDateTime, duration);
      
      // Formatar as datas para consulta
      const startDate = startDateTime.toISOString();
      const endDate = endDateTime.toISOString();
      
      // Buscar agendamentos que possam conflitar com o horário desejado
      let query = supabase
        .from('appointments')
        .select('id, scheduled_date, estimated_duration, description, clients(name)')
        .eq('team_id', teamId)
        .eq('organization_id', organizationId)
        .neq('status', 'canceled') // Ignorar agendamentos cancelados
        .or(`scheduled_date.gte.${startDate},scheduled_date.lt.${endDate}`);
      
      // Se estiver editando um agendamento existente, ignorá-lo na verificação
      if (currentAppointmentId) {
        query = query.neq('id', currentAppointmentId);
      }
      
      const { data: conflictingAppointments, error } = await query;
      
      if (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return { 
          available: false, 
          message: 'Erro ao verificar disponibilidade da equipe.' 
        };
      }
      
      // Verificar se há conflitos reais considerando a duração de cada agendamento
      const actualConflicts = conflictingAppointments?.filter(appointment => {
        const appointmentStart = parseISO(appointment.scheduled_date);
        const appointmentEnd = addHours(appointmentStart, appointment.estimated_duration || 1);
        
        // Verificar se há sobreposição entre os intervalos
        return (
          isWithinInterval(startDateTime, { start: appointmentStart, end: appointmentEnd }) ||
          isWithinInterval(endDateTime, { start: appointmentStart, end: appointmentEnd }) ||
          (startDateTime <= appointmentStart && endDateTime >= appointmentEnd)
        );
      }) || [];
      
      if (actualConflicts.length > 0) {
        const conflictDetails = actualConflicts.map(conflict => {
          const startTime = format(parseISO(conflict.scheduled_date), 'HH:mm');
          const clientName = conflict.clients?.name || 'Cliente não especificado';
          return `${clientName} às ${startTime}`;
        }).join(', ');
        
        return {
          available: false,
          message: `A equipe já possui ${actualConflicts.length} agendamento(s) neste horário: ${conflictDetails}`,
          conflictingAppointments: actualConflicts
        };
      }
      
      return { available: true };
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return { 
        available: true, 
        message: 'Não foi possível verificar a disponibilidade com precisão.' 
      };
    }
  };

  return { checkTeamAvailability };
};