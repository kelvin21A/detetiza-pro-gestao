import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClientForm } from '@/components/clients/ClientForm';
import { useClients } from '@/hooks/useClients';

export default function ClientCreate() {
  const [loading, setLoading] = useState(false);
  const { createClient } = useClients();
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    setLoading(true);
    const { error } = await createClient(data);
    setLoading(false);
    
    if (!error) {
      navigate('/clientes');
    }
  };

  const handleCancel = () => {
    navigate('/clientes');
  };

  return (
    <AppLayout title="Novo Cliente">
      <div className="max-w-4xl mx-auto">
        <ClientForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </AppLayout>
  );
}