import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_CLIENTS, Client } from '@/data/mockData';

// Client interface is now imported from mockData.ts

// Mock data is now centralized in mockData.ts

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