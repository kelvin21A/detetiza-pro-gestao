import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ServiceCall {
  id: string;
  title: string;
  description?: string;
  client_id: string;
  status: string;
  scheduled_date?: string;
  completed_date?: string;
  team_id?: string;
  service_type?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  clients?: {
    name: string;
    address?: string;
  };
  teams?: {
    name: string;
  };
}

export function useServiceCalls() {
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchServiceCalls = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_calls')
        .select(`
          *,
          clients(name, address),
          teams(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServiceCalls(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar chamados',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createServiceCall = async (serviceCall: Omit<Partial<ServiceCall>, 'id' | 'created_at' | 'updated_at' | 'clients' | 'teams'> & { title: string; client_id: string }) => {
    try {
      // Get current user's organization_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organização não encontrada');
      }

      const { data, error } = await supabase
        .from('service_calls')
        .insert([{ ...serviceCall, organization_id: profile.organization_id }])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Chamado criado com sucesso!',
        description: `Chamado ${serviceCall.title} foi adicionado`
      });
      
      await fetchServiceCalls();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao criar chamado',
        description: error.message,
        variant: 'destructive'
      });
      return { data: null, error };
    }
  };

  const updateServiceCall = async (id: string, updates: Partial<ServiceCall>) => {
    try {
      const { data, error } = await supabase
        .from('service_calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Chamado atualizado com sucesso!',
        description: `Chamado foi atualizado`
      });
      
      await fetchServiceCalls();
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar chamado',
        description: error.message,
        variant: 'destructive'
      });
      return { data: null, error };
    }
  };

  const deleteServiceCall = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_calls')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Chamado removido com sucesso!',
        description: 'O chamado foi removido do sistema'
      });
      
      await fetchServiceCalls();
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao remover chamado',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchServiceCalls();
  }, []);

  return {
    serviceCalls,
    loading,
    fetchServiceCalls,
    createServiceCall,
    updateServiceCall,
    deleteServiceCall
  };
}