import { useState, useEffect } from 'react';
import { supabase, TABLES } from '../lib/supabaseClient';
import type { Database } from '../types/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type Contract = Database['public']['Tables']['contracts']['Row'];
type ServiceCall = Database['public']['Tables']['service_calls']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Custom hook for clients
export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .select('*');
      
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Partial<Client>): Promise<ServiceResult<Client>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .insert([clientData])
        .select()
        .single();
      
      if (error) throw error;
      setClients(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>): Promise<ServiceResult<Client>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .update(clientData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setClients(prev => prev.map(client => 
        client.id === id ? data : client
      ));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  };

  const deleteClient = async (id: string): Promise<ServiceResult<void>> => {
    try {
      const { error } = await supabase
        .from(TABLES.CLIENTS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setClients(prev => prev.filter(client => client.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient
  };
};

// Custom hook for contracts
export const useContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(TABLES.CONTRACTS)
        .select('*, clients(*)');
      
      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createContract = async (contractData: Partial<Contract>): Promise<ServiceResult<Contract>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CONTRACTS)
        .insert([contractData])
        .select('*, clients(*)')
        .single();
      
      if (error) throw error;
      setContracts(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  };

  const updateContract = async (id: string, contractData: Partial<Contract>): Promise<ServiceResult<Contract>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CONTRACTS)
        .update(contractData)
        .eq('id', id)
        .select('*, clients(*)')
        .single();
      
      if (error) throw error;
      setContracts(prev => prev.map(contract => 
        contract.id === id ? data : contract
      ));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  };

  const deleteContract = async (id: string): Promise<ServiceResult<void>> => {
    try {
      const { error } = await supabase
        .from(TABLES.CONTRACTS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setContracts(prev => prev.filter(contract => contract.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return {
    contracts,
    loading,
    error,
    refetch: fetchContracts,
    createContract,
    updateContract,
    deleteContract
  };
};