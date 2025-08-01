import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClientForm } from '@/components/clients/ClientForm';
import { useClients, Client } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ClientEdit() {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const { updateClient } = useClients();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setClient(data);
      } catch (error) {
        console.error('Error fetching client:', error);
        navigate('/clientes');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    
    setLoading(true);
    const { error } = await updateClient(id, data);
    setLoading(false);
    
    if (!error) {
      navigate('/clientes');
    }
  };

  const handleCancel = () => {
    navigate('/clientes');
  };

  if (fetchLoading) {
    return (
      <AppLayout title="Editando Cliente">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout title="Cliente não encontrado">
        <div className="text-center">
          <p>Cliente não encontrado.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Editar Cliente">
      <div className="max-w-4xl mx-auto">
        <ClientForm
          client={client}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </AppLayout>
  );
}