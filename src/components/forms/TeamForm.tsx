import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTeams, Team, NewTeam } from '@/hooks/useTeams';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().optional(),
});

type TeamFormValues = z.infer<typeof formSchema>;

interface TeamFormProps {
  initialData?: Team;
}

export function TeamForm({ initialData }: TeamFormProps) {
  const navigate = useNavigate();
  const { createTeam, updateTeam } = useTeams();
  const isEditMode = !!initialData;

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode
      ? { name: initialData.name, description: initialData.description || '' }
      : { name: '', description: '' },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: TeamFormValues) => {
    try {
      if (isEditMode) {
        await updateTeam({ id: initialData.id, updates: values });
      } else {
        await createTeam(values as NewTeam);
      }
      navigate('/equipes');
    } catch (error) {
      // O toast de erro já é tratado no hook
      console.error('Erro ao salvar equipe:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Equipe</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Equipe Alfa" {...field} />
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
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva as responsabilidades ou membros da equipe"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/equipes')}>
                Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditMode ? 'Salvar Alterações' : 'Criar Equipe'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
