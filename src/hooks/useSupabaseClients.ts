import { useState, useEffect } from 'react';
import { clientService } from '../services/database';
import { toast } from 'sonner';

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  neighborhood?: string;
  complement?: string;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  contracts?: Contract[];
}

export interface Contract {
  id: string;
  contract_number: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  start_date: string;
  end_date: string;
  value: number;
  services?: {
    name: string;
    type: string;
  };
}

export const useSupabaseClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await clientService.getAll();
      
      if (error) {
        throw new Error(error.message || 'Erro ao buscar clientes');
      }
      
      setClients(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro inesperado ao buscar clientes';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Omit<Client, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active'>) => {
    try {
      const { data, error } = await clientService.create(clientData);
      
      if (error) {
        throw new Error(error.message || 'Erro ao criar cliente');
      }
      
      if (data) {
        setClients(prev => [data, ...prev]);
        toast.success('Cliente criado com sucesso!');
        return { success: true, data };
      }
      
      return { success: false, error: 'Dados não retornados' };
    } catch (err: any) {
      const errorMessage = err.message || 'Erro inesperado ao criar cliente';
      toast.error(errorMessage);
      console.error('Error creating client:', err);
      return { success: false, error: errorMessage };
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      const { data, error } = await clientService.update(id, clientData);
      
      if (error) {
        throw new Error(error.message || 'Erro ao atualizar cliente');
      }
      
      if (data) {
        setClients(prev => prev.map(client => 
          client.id === id ? { ...client, ...data } : client
        ));
        toast.success('Cliente atualizado com sucesso!');
        return { success: true, data };
      }
      
      return { success: false, error: 'Dados não retornados' };
    } catch (err: any) {
      const errorMessage = err.message || 'Erro inesperado ao atualizar cliente';
      toast.error(errorMessage);
      console.error('Error updating client:', err);
      return { success: false, error: errorMessage };
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { data, error } = await clientService.delete(id);
      
      if (error) {
        throw new Error(error.message || 'Erro ao excluir cliente');
      }
      
      // Remove from local state (soft delete sets is_active to false)
      setClients(prev => prev.filter(client => client.id !== id));
      toast.success('Cliente excluído com sucesso!');
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Erro inesperado ao excluir cliente';
      toast.error(errorMessage);
      console.error('Error deleting client:', err);
      return { success: false, error: errorMessage };
    }
  };

  const getClientById = async (id: string) => {
    try {
      const { data, error } = await clientService.getById(id);
      
      if (error) {
        throw new Error(error.message || 'Erro ao buscar cliente');
      }
      
      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Erro inesperado ao buscar cliente';
      toast.error(errorMessage);
      console.error('Error fetching client:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Auto-fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    refetch: fetchClients
  };
};
