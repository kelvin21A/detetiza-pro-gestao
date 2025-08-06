import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAppointments } from '@/hooks/useAppointments';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/hooks/useAppointments';

// Configuração do localizador para date-fns em Português-Brasil
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

// Mensagens traduzidas para o calendário
const messages = {
  allDay: 'Dia Inteiro',
  previous: 'Anterior',
  next: 'Próximo',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Não há eventos neste período.',
  showMore: (total: number) => `+ Ver mais (${total})`,
};

export const Agenda = () => {
  const navigate = useNavigate();
  const { appointments, isLoading, error } = useAppointments();

  // Mapeia os agendamentos para o formato de evento do calendário
  const events = useMemo(() => {
    if (!appointments) return [];
    return appointments.map((appointment: Appointment) => ({
      title: appointment.clients?.name || 'Serviço Agendado',
      start: new Date(appointment.scheduled_date),
      end: new Date(appointment.scheduled_date),
      resource: appointment, // Guarda o objeto original para uso posterior
    }));
  }, [appointments]);

  const handleSelectEvent = (event: { resource: Appointment }) => {
    navigate(`/agenda/editar/${event.resource.id}`);
  };

  if (isLoading) return <div>Carregando agenda...</div>;
  if (error) return <div>Erro ao carregar os agendamentos: {error.message}</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Agenda de Serviços</h1>
        <Button onClick={() => navigate('/agenda/novo')}>Novo Agendamento</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '75vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.MONTH}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          messages={messages}
          culture='pt-BR'
          onSelectEvent={handleSelectEvent}
          eventPropGetter={(event) => {
            // Estilização customizada dos eventos
            const backgroundColor = '#3174ad'; // Azul padrão do shadcn
            const style = {
              backgroundColor,
              borderRadius: '5px',
              opacity: 0.8,
              color: 'white',
              border: '0px',
              display: 'block',
            };
            return { style };
          }}
        />
      </div>
    </div>
  );
};
