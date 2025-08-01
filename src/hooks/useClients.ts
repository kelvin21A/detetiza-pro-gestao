import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cnpj_cpf?: string;
  address?: string;
  status: string;
  last_service_date?: string;
  next_renewal_date?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// Mock data for testing
const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Restaurante Bom Sabor',
    email: 'contato@bomsabor.com',
    phone: '(11) 3456-7890',
    cnpj_cpf: '12.345.678/0001-90',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    status: 'em-dia',
    last_service_date: '2024-01-15',
    next_renewal_date: '2024-07-15',
    organization_id: 'test-org-id',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    name: 'Padaria Central',
    email: 'admin@padariacentral.com.br',
    phone: '(11) 2345-6789',
    cnpj_cpf: '98.765.432/0001-10',
    address: 'Av. Principal, 456 - São Paulo, SP',
    status: 'proximo-vencimento',
    last_service_date: '2024-01-10',
    next_renewal_date: '2024-02-10',
    organization_id: 'test-org-id',
    created_at: '2023-12-15T09:00:00Z',
    updated_at: '2024-01-10T16:45:00Z'
  },
  {
    id: '3',
    name: 'Supermercado Família',
    email: 'gerencia@superfamilia.com',
    phone: '(11) 4567-8901',
    cnpj_cpf: '11.222.333/0001-44',
    address: 'Rua do Comércio, 789 - São Paulo, SP',
    status: 'vencido',
    last_service_date: '2023-11-20',
    next_renewal_date: '2023-12-20',
    organization_id: 'test-org-id',
    created_at: '2023-11-01T08:00:00Z',
    updated_at: '2023-11-20T11:20:00Z'
  }
];

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if we're in test mode
  const isTestMode = user?.id === 'test-user-id' || localStorage.getItem('detetizapro_test_user');

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      if (isTestMode) {
        // Use mock data for test mode
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        const savedClients = localStorage.getItem('detetizapro_test_clients');
        if (savedClients) {
          setClients(JSON.parse(savedClients));
        } else {
          setClients(MOCK_CLIENTS);
          localStorage.setItem('detetizapro_test_clients', JSON.stringify(MOCK_CLIENTS));
        }
      } else {
        // Use real Supabase data
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setClients(data || []);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar clientes',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (client: Omit<Partial<Client>, 'id' | 'created_at' | 'updated_at'> & { name: string }) => {
    try {
      if (isTestMode) {
        // Mock client creation
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
        
        const newClient: Client = {
          ...client,
          id: Date.now().toString(),
          organization_id: 'test-org-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: client.status || 'em-dia'
        };
        
        const savedClients = localStorage.getItem('detetizapro_test_clients');
        const currentClients = savedClients ? JSON.parse(savedClients) : MOCK_CLIENTS;
        const updatedClients = [newClient, ...currentClients];
        
        localStorage.setItem('detetizapro_test_clients', JSON.stringify(updatedClients));
        setClients(updatedClients);
        
        toast({
          title: 'Cliente criado com sucesso!',
          description: `Cliente ${client.name} foi adicionado`
        });
        
        return { data: newClient, error: null };
      } else {
        // Real Supabase creation
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (!profile?.organization_id) {
          throw new Error('Organização não encontrada');
        }

        const { data, error } = await supabase
          .from('clients')
          .insert([{ ...client, organization_id: profile.organization_id }])
          .select()
          .single();

        if (error) throw error;
        
        toast({
          title: 'Cliente criado com sucesso!',
          description: `Cliente ${client.name} foi adicionado`
        });
        
        await fetchClients();
        return { data, error: null };
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar cliente',
        description: error.message,
        variant: 'destructive'
      });
      return { data: null, error };
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      if (isTestMode) {
        // Mock client update
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
        
        const savedClients = localStorage.getItem('detetizapro_test_clients');
        const currentClients = savedClients ? JSON.parse(savedClients) : MOCK_CLIENTS;
        
        const updatedClients = currentClients.map((client: Client) => 
          client.id === id 
            ? { ...client, ...updates, updated_at: new Date().toISOString() }
            : client
        );
        
        localStorage.setItem('detetizapro_test_clients', JSON.stringify(updatedClients));
        setClients(updatedClients);
        
        toast({
          title: 'Cliente atualizado com sucesso!',
          description: `Cliente ${updates.name || 'foi'} atualizado`
        });
        
        return { data: updatedClients.find((c: Client) => c.id === id), error: null };
      } else {
        // Real Supabase update
        const { data, error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        toast({
          title: 'Cliente atualizado com sucesso!',
          description: `Cliente ${updates.name || 'foi'} atualizado`
        });
        
        await fetchClients();
        return { data, error: null };
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar cliente',
        description: error.message,
        variant: 'destructive'
      });
      return { data: null, error };
    }
  };

  const deleteClient = async (id: string) => {
    try {
      if (isTestMode) {
        // Mock client deletion
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
        
        const savedClients = localStorage.getItem('detetizapro_test_clients');
        const currentClients = savedClients ? JSON.parse(savedClients) : MOCK_CLIENTS;
        
        const updatedClients = currentClients.filter((client: Client) => client.id !== id);
        
        localStorage.setItem('detetizapro_test_clients', JSON.stringify(updatedClients));
        setClients(updatedClients);
        
        toast({
          title: 'Cliente removido com sucesso!',
          description: 'O cliente foi removido do sistema'
        });
        
        return { error: null };
      } else {
        // Real Supabase deletion
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        toast({
          title: 'Cliente removido com sucesso!',
          description: 'O cliente foi removido do sistema'
        });
        
        await fetchClients();
        return { error: null };
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao remover cliente',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchClients();
  }, [isTestMode]);

  return {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient
  };
}