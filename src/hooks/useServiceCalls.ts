import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ServiceCallStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ServiceType = 'dedetization' | 'desratization' | 'descupinization' | 'sanitization' | 'fumigation';

export interface ServiceCall {
  id: string;
  title: string;
  description: string | null;
  client_id: string;
  status: ServiceCallStatus | null;
  scheduled_date: string | null;
  completed_date: string | null;
  team_id: string | null;
  service_type: ServiceType | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  // Relationships
  clients?: {
    name: string;
    address: string | null;
    phone: string | null;
  } | null;
  teams?: {
    name: string;
  } | null;
}

interface ServiceCallFilters {
  status?: ServiceCallStatus | 'todos';
  search?: string;
  clientId?: string;
  teamId?: string;
  startDate?: string;
  endDate?: string;
}

export function useServiceCalls() {
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Get current user's organization ID
  const getOrganizationId = useCallback(async (): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error(profileError?.message || 'Perfil não encontrado');
      }

      return profile.organization_id;
    } catch (err) {
      console.error('Error getting organization ID:', err);
      throw new Error('Falha ao obter organização do usuário');
    }
  }, []);

  // Fetch service calls with filters
  const fetchServiceCalls = useCallback(async (filters: Partial<ServiceCallFilters> = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const organizationId = await getOrganizationId();
      
      let query = supabase
        .from('service_calls')
        .select(`
          *,
          clients(id, name, address, phone),
          teams(id, name)
        `)
        .eq('organization_id', organizationId);

      // Apply filters
      if (filters.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,
          description.ilike.%${filters.search}%,
          clients.name.ilike.%${filters.search}%`
        );
      }

      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters.teamId) {
        query = query.eq('team_id', filters.teamId);
      }

      if (filters.startDate) {
        query = query.gte('scheduled_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('scheduled_date', filters.endDate);
      }

      // Order by scheduled date (upcoming first) and then by creation date
      query = query
        .order('scheduled_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      setServiceCalls(data || []);
      return data || [];
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching service calls:', error);
      setError(error);
      toast({
        title: 'Erro ao carregar chamados',
        description: error.message,
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [getOrganizationId, toast]);

  // Create a new service call
  const createServiceCall = useCallback(async (serviceCall: Omit<
    ServiceCall, 
    'id' | 'created_at' | 'updated_at' | 'organization_id' | 'status'
  >) => {
    try {
      setLoading(true);
      const organizationId = await getOrganizationId();
      
      const { data, error } = await supabase
        .from('service_calls')
        .insert([{ 
          ...serviceCall, 
          organization_id: organizationId,
          status: 'pending', // Default status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchServiceCalls();
      
      toast({
        title: 'Chamado criado com sucesso!',
        description: `Chamado "${serviceCall.title}" foi adicionado`
      });
      
      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error creating service call:', error);
      toast({
        title: 'Erro ao criar chamado',
        description: error.message,
        variant: 'destructive'
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [fetchServiceCalls, getOrganizationId, toast]);

  // Update an existing service call
  const updateServiceCall = useCallback(async (id: string, updates: Partial<ServiceCall>) => {
    try {
      setLoading(true);
      const organizationId = await getOrganizationId();
      
      // Ensure we're only updating fields that are allowed to be updated
      const { id: _, organization_id, created_at, ...safeUpdates } = updates;
      
      const { data, error } = await supabase
        .from('service_calls')
        .update({ 
          ...safeUpdates,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('organization_id', organizationId) // Ensure we only update our org's records
        .select()
        .single();

      if (error) throw error;
      
      await fetchServiceCalls();
      
      toast({
        title: 'Chamado atualizado com sucesso!',
        description: 'As alterações foram salvas'
      });
      
      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error updating service call:', error);
      toast({
        title: 'Erro ao atualizar chamado',
        description: error.message,
        variant: 'destructive'
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [fetchServiceCalls, getOrganizationId, toast]);

  // Delete a service call
  const deleteServiceCall = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const organizationId = await getOrganizationId();
      
      const { error } = await supabase
        .from('service_calls')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId); // Ensure we only delete our org's records

      if (error) throw error;
      
      await fetchServiceCalls();
      
      toast({
        title: 'Chamado removido com sucesso!',
        description: 'O chamado foi removido do sistema'
      });
      
      return { error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting service call:', error);
      toast({
        title: 'Erro ao remover chamado',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [fetchServiceCalls, getOrganizationId, toast]);

  // Mark a service call as completed
  const completeServiceCall = useCallback(async (id: string, notes?: string) => {
    return updateServiceCall(id, { 
      status: 'completed',
      completed_date: new Date().toISOString(),
      ...(notes && { notes })
    });
  }, [updateServiceCall]);

  // Mark a service call as in progress
  const startServiceCall = useCallback(async (id: string, teamId: string) => {
    return updateServiceCall(id, { 
      status: 'in_progress',
      team_id: teamId,
      started_at: new Date().toISOString()
    });
  }, [updateServiceCall]);

  // Get a single service call by ID
  const getServiceCallById = useCallback(async (id: string): Promise<ServiceCall | null> => {
    try {
      const organizationId = await getOrganizationId();
      
      const { data, error } = await supabase
        .from('service_calls')
        .select(`
          *,
          clients(id, name, address, phone),
          teams(id, name)
        `)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting service call:', err);
      return null;
    }
  }, [getOrganizationId]);

  // Get service calls by status
  const getServiceCallsByStatus = useCallback(async (status: ServiceCallStatus) => {
    return fetchServiceCalls({ status });
  }, [fetchServiceCalls]);

  // Get today's service calls
  const getTodaysServiceCalls = useCallback(async () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    
    return fetchServiceCalls({ 
      startDate: startOfDay, 
      endDate: endOfDay 
    });
  }, [fetchServiceCalls]);

  // Initial fetch
  useEffect(() => {
    fetchServiceCalls();
  }, [fetchServiceCalls]);

  return {
    serviceCalls,
    loading,
    error,
    fetchServiceCalls,
    createServiceCall,
    updateServiceCall,
    deleteServiceCall,
    completeServiceCall,
    startServiceCall,
    getServiceCallById,
    getServiceCallsByStatus,
    getTodaysServiceCalls
  };
}