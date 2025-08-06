import { useParams } from 'react-router-dom';
import { AppointmentForm } from '@/components/forms/AppointmentForm';
import { useAppointments } from '@/hooks/useAppointments';

const EditarAgendamento = () => {
  const { id } = useParams<{ id: string }>();
  const { appointments, isLoading, error } = useAppointments();

  if (isLoading) {
    return <div>Carregando agendamento...</div>;
  }

  if (error) {
    return <div>Erro ao carregar os dados.</div>;
  }

  const appointment = appointments?.find((a) => a.id === id);

  if (!appointment) {
    return <div>Agendamento não encontrado.</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Editar Agendamento</h1>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <AppointmentForm appointment={appointment} />
      </div>
    </div>
  );
};

export default EditarAgendamento;
