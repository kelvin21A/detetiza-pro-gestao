import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients, Client } from '@/hooks/useClients';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }).nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  status: z.enum(['em-dia', 'a-vencer', 'vencido']), 
  // Adicionando campos que podem ser nulos para corresponder à tabela
  city: z.string().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  last_service_date: z.string().nullable().optional(),
  next_renewal_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip_code: z.string().nullable().optional(),
});

type ClientFormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  initialData?: Client;
}

export function ClientForm({ initialData }: ClientFormProps) {
  const navigate = useNavigate();
  const { createClient, updateClient } = useClients();
  const isEditMode = !!initialData;

    const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      status: initialData.status as 'em-dia' | 'a-vencer' | 'vencido',
    } : {
      name: '',
      email: '',
      phone: '',
      address: '',
      status: 'em-dia',
      city: '',
      contact_person: '',
      document: '',
      last_service_date: '',
      next_renewal_date: '',
      notes: '',
      state: '',
      zip_code: '',
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: ClientFormValues) => {
    // Garante que strings vazias para campos opcionais sejam convertidas para null
    const dataToSave = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value === '' ? null : value])
    );

    try {
      if (isEditMode && initialData) {
        // @ts-ignore
        await updateClient({ id: initialData.id, updates: dataToSave });
      } else {
        // @ts-ignore
        await createClient(dataToSave);
      }
      navigate('/clientes');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
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
              <FormLabel>Nome Completo / Razão Social</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva ou Empresa XYZ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="contato@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Telefone / WhatsApp</FormLabel>
                <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, Número, Bairro, Cidade - Estado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Status do Contrato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="em-dia">Em dia</SelectItem>
                            <SelectItem value="a-vencer">A vencer</SelectItem>
                            <SelectItem value="vencido">Vencido</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormDescription>
                        Indica a situação atual do contrato do cliente.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />

        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/clientes')}>
                Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditMode ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
