import { AppointmentForm } from '@/components/forms/AppointmentForm';

const NovoAgendamento = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Novo Agendamento</h1>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <AppointmentForm />
      </div>
    </div>
  );
};

export default NovoAgendamento;
