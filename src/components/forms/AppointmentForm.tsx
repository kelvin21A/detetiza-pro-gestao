import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useClients } from '@/hooks/useClients';
import { useTeams } from '@/hooks/useTeams';
import { Appointment, useAppointments } from '@/hooks/useAppointments';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, addHours, setHours, setMinutes, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTeamAvailability } from '@/hooks/useTeamAvailability';
import { useClientContracts } from '@/hooks/useClientContracts';

// Esquema de validação para o formulário de agendamento
const appointmentFormSchema = z.object({
  client_id: z.string({ required_error: 'Selecione um cliente.' }),
  team_id: z.string().optional(),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  scheduled_date: z.date({ required_error: 'A data do agendamento é obrigatória.' }),
  scheduled_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido. Use HH:MM.'),
  estimated_duration: z.coerce.number().min(1, 'A duração estimada deve ser de pelo menos 1 hora.').max(24, 'A duração não pode exceder 24 horas.').default(1),
  value: z.coerce.number().min(0, 'O valor não pode ser negativo.').optional(),
  status: z.enum(['scheduled', 'completed', 'invoiced', 'paid', 'canceled']).default('scheduled'),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  appointment?: Appointment;
}

export const AppointmentForm = ({ appointment }: AppointmentFormProps) => {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { teams } = useTeams();
  const { createAppointment, updateAppointment } = useAppointments();

  const [teamAvailability, setTeamAvailability] = useState<{ available: boolean; message?: string }>({ available: true });
  const [clientHasActiveContract, setClientHasActiveContract] = useState<boolean>(true);

  // Extrair hora e data do agendamento existente
  const getTimeFromDate = (dateString?: string | null) => {
    if (!dateString) return '09:00';
    const date = parseISO(dateString);
    return format(date, 'HH:mm');
  };

  const defaultValues: Partial<AppointmentFormValues> = appointment
    ? {
        ...appointment,
        scheduled_date: appointment.scheduled_date ? parseISO(appointment.scheduled_date) : new Date(),
        scheduled_time: getTimeFromDate(appointment.scheduled_date),
        team_id: appointment.team_id || '',
        value: appointment.value ? parseFloat(appointment.value) : 0,
        estimated_duration: 1, // Valor padrão
        status: appointment.status as any || 'scheduled',
        address: appointment.address || '',
        notes: appointment.notes || '',
      }
    : {
        team_id: '',
        value: 0,
        scheduled_time: '09:00',
        estimated_duration: 1,
        status: 'scheduled',
      };

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues,
  });

  // Hooks para verificação de disponibilidade e contratos
  const { checkTeamAvailability } = useTeamAvailability();
  const { checkActiveContract } = useClientContracts();

  // Verificar disponibilidade da equipe quando o usuário selecionar uma equipe e data/hora
  useEffect(() => {
    const teamId = form.watch('team_id');
    const scheduledDate = form.watch('scheduled_date');
    const scheduledTime = form.watch('scheduled_time');
    const duration = form.watch('estimated_duration') || 1;
    
    if (teamId && scheduledDate && scheduledTime) {
      const appointmentId = appointment?.id;
      
      // Verificar disponibilidade da equipe
      checkTeamAvailability(teamId, scheduledDate, scheduledTime, duration, appointmentId)
        .then(result => {
          setTeamAvailability(result);
        })
        .catch(error => {
          console.error('Erro ao verificar disponibilidade:', error);
          setTeamAvailability({ available: true, message: 'Não foi possível verificar a disponibilidade.' });
        });
    } else {
      // Resetar o estado se não houver equipe selecionada
      setTeamAvailability({ available: true });
    }
  }, [form.watch('team_id'), form.watch('scheduled_date'), form.watch('scheduled_time'), form.watch('estimated_duration'), appointment?.id]);

  // Verificar se o cliente tem contrato ativo quando selecionado
  useEffect(() => {
    const clientId = form.watch('client_id');
    
    if (clientId) {
      // Verificar se o cliente tem contrato ativo
      checkActiveContract(clientId)
        .then(result => {
          setClientHasActiveContract(result.hasActiveContract);
        })
        .catch(error => {
          console.error('Erro ao verificar contrato do cliente:', error);
          setClientHasActiveContract(true); // Assumir que tem contrato em caso de erro
        });
    }
  }, [form.watch('client_id')]);

  // Combinar data e hora para criar o timestamp completo
  const combineDateTime = (date: Date, timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime.toISOString();
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      // Combinar data e hora em um único campo ISO string
      const scheduledDateTime = combineDateTime(data.scheduled_date, data.scheduled_time);
      
      // Preparar os dados para envio
      const appointmentData = {
        ...data,
        scheduled_date: scheduledDateTime,
        // Remover o campo scheduled_time que não existe no banco de dados
        scheduled_time: undefined,
      };
      
      if (appointment) {
        // Modo Edição
        await updateAppointment({ id: appointment.id, updates: appointmentData as any });
      } else {
        // Modo Criação
        await createAppointment(appointmentData as any);
      }
      navigate('/agenda'); // Navegar para a página de agenda
    } catch (error) {
      console.error('Falha ao salvar o agendamento:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!clientHasActiveContract && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Este cliente não possui um contrato ativo. Recomendamos verificar a situação contratual antes de agendar um serviço.
            </AlertDescription>
          </Alert>
        )}

        {!teamAvailability.available && (
          <Alert variant="warning" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Aviso de Disponibilidade</AlertTitle>
            <AlertDescription>
              {teamAvailability.message || 'A equipe selecionada pode não estar disponível no horário escolhido. Verifique a agenda da equipe.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cliente */}
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Selecione o cliente para o qual o serviço será realizado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Equipe */}
          <FormField
            control={form.control}
            name="team_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipe</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a equipe (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>A equipe que realizará o serviço. Deixe em branco se ainda não definido.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data do Agendamento */}
          <FormField
            control={form.control}
            name="scheduled_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Agendamento *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar 
                      mode="single" 
                      selected={field.value} 
                      onSelect={field.onChange} 
                      initialFocus 
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Selecione a data para o agendamento.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hora do Agendamento */}
          <FormField
            control={form.control}
            name="scheduled_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora do Agendamento *</FormLabel>
                <div className="flex items-center">
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                      className="w-full" 
                    />
                  </FormControl>
                  <Clock className="ml-2 h-4 w-4 opacity-50" />
                </div>
                <FormDescription>Horário de início do serviço (formato 24h).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duração Estimada */}
          <FormField
            control={form.control}
            name="estimated_duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração Estimada (horas)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    max="24" 
                    step="0.5" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Tempo estimado para a realização do serviço.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Valor */}
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01" 
                    min="0" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Valor cobrado pelo serviço.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="invoiced">Faturado</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Estado atual do agendamento.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Endereço */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Endereço do serviço" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>Local onde o serviço será realizado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Serviço *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva os detalhes do serviço a ser realizado..." 
                  {...field} 
                  value={field.value || ''}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormDescription>Detalhes sobre o serviço a ser realizado.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Observações */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações adicionais sobre o agendamento..." 
                  {...field} 
                  value={field.value || ''}
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormDescription>Informações adicionais relevantes para o agendamento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/agenda')}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
            className="min-w-[120px]"
          >
            {form.formState.isSubmitting ? 'Salvando...' : appointment ? 'Atualizar' : 'Agendar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
