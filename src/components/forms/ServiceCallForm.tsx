import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useClients } from '@/hooks/useClients';
import { useTeams } from '@/hooks/useTeams';
import { useServiceCalls, ServiceCall, NewServiceCall } from '@/hooks/useServiceCalls';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres.' }),
  client_id: z.string().uuid({ message: 'Selecione um cliente.' }),
  team_id: z.preprocess(
    (val) => (val === '' || val === 'none' ? null : val),
    z.string().uuid({ message: 'O ID da equipe deve ser um UUID válido.' }).nullable().optional()
  ),
  description: z.string().min(5, { message: 'A descrição deve ter pelo menos 5 caracteres.' }),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(), 
  scheduled_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Data inválida.' }),
});

type ServiceCallFormValues = z.infer<typeof formSchema>;

interface ServiceCallFormProps {
  initialData?: ServiceCall;
}

export function ServiceCallForm({ initialData }: ServiceCallFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clients, isLoading: isLoadingClients } = useClients();
  const { teams, isLoading: isLoadingTeams } = useTeams();
  const { createServiceCall, updateServiceCall } = useServiceCalls();

  const isEditMode = !!initialData;

  const form = useForm<ServiceCallFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? { 
          ...initialData,
          team_id: initialData.team_id || '',
          scheduled_date: new Date(initialData.scheduled_date).toISOString().substring(0, 16),
        }
      : { 
          title: '',
          client_id: '',
          description: '', 
          team_id: '',
          scheduled_date: new Date().toISOString().substring(0, 16),
        },
  });

  const isLoading = form.formState.isSubmitting || isLoadingClients || isLoadingTeams;

  const onSubmit = async (values: ServiceCallFormValues) => {
    try {
      if (isEditMode) {
        await updateServiceCall({ id: initialData.id, updates: values as ServiceCall });
        toast({ description: 'Chamado atualizado com sucesso!' });
      } else {
        const submissionData: NewServiceCall = {
          ...values,
          status: 'pending',
        };
        await createServiceCall(submissionData);
        toast({ description: 'Chamado criado com sucesso!' });
      }
      navigate('/chamados');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar chamado', description: error.message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Chamado</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Controle de pragas em condomínio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients?.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Serviço</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva o serviço a ser realizado..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data e Hora Agendada</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="team_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipe Responsável</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma equipe..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {teams?.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEditMode && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Salvar Alterações' : 'Criar Chamado'}
        </Button>
      </form>
    </Form>
  );
}
