import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_CLIENTS, Client } from '@/data/mockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Client interface is now imported from mockData.ts

// Mock data is now centralized in mockData.ts

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if we're in test mode
  const isTestMode = user?.id === 'test-user-id' || localStorage.getItem('detetizapro_test_user');

  // Apply search and filter whenever clients, searchTerm, or statusFilter changes
  useEffect(() => {
    let result = [...clients];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(client => 
        client.name.toLowerCase().includes(term) ||
        (client.email?.toLowerCase().includes(term) || false) ||
        (client.phone?.includes(term) || false) ||
        (client.cnpj_cpf?.includes(term) || false)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(client => client.status === statusFilter);
    }
    
    setFilteredClients(result);
  }, [clients, searchTerm, statusFilter]);

  const fetchClients = useCallback(async () => {
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
        // Get current user's organization_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
          
        if (!profile?.organization_id) {
          throw new Error('Organização não encontrada');
        }
        
        // Fetch clients filtered by organization_id
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setClients(data || []);
        setFilteredClients(data || []);
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
  }, [isTestMode, toast, user?.id]);

  const validateClientData = (client: Partial<Client>) => {
    if (!client.name?.trim()) {
      throw new Error('O nome do cliente é obrigatório');
    }
    
    if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
      throw new Error('E-mail inválido');
    }
    
    if (client.phone) {
      const phoneDigits = client.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        throw new Error('Telefone inválido. Use o formato (DD) 99999-9999');
      }
    }
    
    if (client.cnpj_cpf) {
      const cpfCnpjDigits = client.cnpj_cpf.replace(/\D/g, '');
      if (![11, 14].includes(cpfCnpjDigits.length)) {
        throw new Error('CPF/CNPJ inválido. Use 11 dígitos para CPF ou 14 para CNPJ');
      }
    }
  };

  const createClient = async (client: Omit<Partial<Client>, 'id' | 'created_at' | 'updated_at'> & { name: string }) => {
    try {
      // Validate client data
      validateClientData(client);
      
      if (isTestMode) {
        // Mock client creation
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
        
        const newClient: Client = {
          ...client,
          id: `test-${Date.now()}`,
          organization_id: 'test-org-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: client.status || 'em-dia',
          last_service_date: client.last_service_date || null,
          next_service_date: client.next_service_date || null
        };
        
        const savedClients = localStorage.getItem('detetizapro_test_clients');
        const currentClients = savedClients ? JSON.parse(savedClients) : MOCK_CLIENTS;
        const updatedClients = [newClient, ...currentClients];
        
        localStorage.setItem('detetizapro_test_clients', JSON.stringify(updatedClients));
        setClients(updatedClients);
        
        toast({
          title: 'Cliente criado com sucesso!',
          description: `Cliente ${client.name} foi adicionado`,
          variant: 'success'
        });
        
        return { data: newClient, error: null };
      } else {
        // Real Supabase creation
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (!profile?.organization_id) {
          throw new Error('Organização não encontrada');
        }

        const now = new Date().toISOString();
        const newClient = {
          ...client,
          organization_id: profile.organization_id,
          created_at: now,
          updated_at: now,
          status: client.status || 'em-dia'
        };

        const { data, error } = await supabase
          .from('clients')
          .insert([newClient])
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
      // Validate client data
      validateClientData(updates);
      
      if (isTestMode) {
        // Mock client update
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
        
        const savedClients = localStorage.getItem('detetizapro_test_clients');
        const currentClients = savedClients ? JSON.parse(savedClients) : MOCK_CLIENTS;
        
        const updatedClients = currentClients.map((client: Client) => 
          client.id === id 
            ? { 
                ...client, 
                ...updates, 
                updated_at: new Date().toISOString(),
                // Preserve organization_id on update
                organization_id: client.organization_id 
              }
            : client
        );
        
        localStorage.setItem('detetizapro_test_clients', JSON.stringify(updatedClients));
        setClients(updatedClients);
        
        const updatedClient = updatedClients.find((c: Client) => c.id === id);
        
        toast({
          title: 'Cliente atualizado com sucesso!',
          description: `Cliente ${updatedClient?.name || 'foi'} atualizado`,
          variant: 'success'
        });
        
        return { data: updatedClient, error: null };
      } else {
        // Get current user's organization_id for additional security
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
          
        if (!profile?.organization_id) {
          throw new Error('Organização não encontrada');
        }
        
        const now = new Date().toISOString();
        
        // Update client with organization_id filter for security
        const { data, error } = await supabase
          .from('clients')
          .update({
            ...updates,
            updated_at: now
          })
          .eq('id', id)
          .eq('organization_id', profile.organization_id) // Ensure the client belongs to the user's organization
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
        
        const clientToDelete = currentClients.find((c: Client) => c.id === id);
        if (!clientToDelete) {
          throw new Error('Cliente não encontrado');
        }
        
        const updatedClients = currentClients.filter((client: Client) => client.id !== id);
        
        localStorage.setItem('detetizapro_test_clients', JSON.stringify(updatedClients));
        setClients(updatedClients);
        
        toast({
          title: 'Cliente removido com sucesso!',
          description: `O cliente ${clientToDelete.name} foi removido do sistema`,
          variant: 'success'
        });
        
        return { error: null };
      } else {
        // Get current user's organization_id for additional security
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
          
        if (!profile?.organization_id) {
          throw new Error('Organização não encontrada');
        }
        
        // First, get the client to show in the success message
        const { data: clientToDelete } = await supabase
          .from('clients')
          .select('name')
          .eq('id', id)
          .eq('organization_id', profile.organization_id)
          .single();
          
        if (!clientToDelete) {
          throw new Error('Cliente não encontrado ou você não tem permissão para excluí-lo');
        }
        
        // Delete the client with organization_id filter for security
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id)
          .eq('organization_id', profile.organization_id);

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

  // Function to refresh clients data
  const refreshClients = useCallback(async () => {
    await fetchClients();
  }, [fetchClients]);

  // Function to get a client by ID
  const getClientById = useCallback((id: string): Client | undefined => {
    return clients.find(client => client.id === id);
  }, [clients]);

  // Function to get clients by status
  const getClientsByStatus = useCallback((status: string): Client[] => {
    return clients.filter(client => client.status === status);
  }, [clients]);

  // Function to search clients by name, email, phone, or document
  const searchClients = useCallback((term: string): Client[] => {
    if (!term.trim()) return clients;
    
    const searchTerm = term.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm) ||
      (client.email?.toLowerCase().includes(searchTerm) || false) ||
      (client.phone?.includes(searchTerm) || false) ||
      (client.cnpj_cpf?.includes(searchTerm) || false)
    );
  }, [clients]);

  useEffect(() => {
    fetchClients();
  }, [isTestMode]);

  return {
    clients: filteredClients,
    allClients: clients,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    fetchClients,
    refreshClients,
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    getClientsByStatus,
    searchClients,
  };
}