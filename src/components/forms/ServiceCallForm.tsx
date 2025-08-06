import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useClients } from '@/hooks/useClients';
import { useTeams } from '@/hooks/useTeams';
import { useServiceCalls } from '@/hooks/useServiceCalls';
import { ServiceCall } from '@/types';
import { Loader2 } from 'lucide-react';

// Esquema de validação limpo: reflete apenas os campos do formulário.
const formSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  description: z.string().optional(),
  client_id: z.string().min(1, 'O cliente é obrigatório.'),
  team_id: z.string().optional(),
  scheduled_date: z.string().min(1, 'A data é obrigatória.'),
  // O status só é validado no modo de edição, mas o campo pode existir no formulário.
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});

type ServiceCallFormValues = z.infer<typeof formSchema>;

interface ServiceCallFormProps {
  initialData?: ServiceCall;
}

export const ServiceCallForm = ({ initialData }: ServiceCallFormProps) => {
  const navigate = useNavigate();
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
          description: '',
          client_id: '',
          team_id: '',
          scheduled_date: '',
        },
  });

  const isLoading = form.formState.isSubmitting || isLoadingClients || isLoadingTeams;

  const onSubmit = async (values: ServiceCallFormValues) => {
    try {
      if (isEditMode) {
        await updateServiceCall({ id: initialData.id, updates: values });
      } else {
        await createServiceCall(values);
      }
      navigate('/chamados');
    } catch (error) {
      console.error("Erro na submissão do formulário:", error);
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
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Desinsetização em Restaurante" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes do serviço" {...field} />
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
                    <SelectValue placeholder="Selecione um cliente" />
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
          name="team_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipe</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma equipe (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teams?.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data e Hora</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
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
};
