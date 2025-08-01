import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
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
  }, []);

  return {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient
  };
}