import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';

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

// Tipo para os eventos do calendário
type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
};

export const Agenda = () => {
  const navigate = useNavigate();
  const { appointments, isLoading, error } = useAppointments();

  // Mapeia os agendamentos para o formato de evento do calendário
    // Mapeia os agendamentos para o formato de evento do calendário
  const events = useMemo((): CalendarEvent[] => {
    if (!appointments) return [];
    return appointments.map((appointment: Appointment) => ({
      title: appointment.clients?.name || 'Serviço Agendado',
      start: new Date(appointment.scheduled_date),
      end: new Date(appointment.scheduled_date),
      resource: appointment,
    }));
  }, [appointments]);

  const handleSelectEvent = (event: CalendarEvent) => {
    navigate(`/agenda/editar/${event.resource.id}`);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Agenda Gerencial</h1>
          <p className="text-muted-foreground">Visualize e gerencie os agendamentos de serviços.</p>
        </div>
        <Button onClick={() => navigate('/agenda/novo')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-0">
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="flex h-full items-center justify-center text-red-500">
              Erro ao carregar agendamentos: {error.message}
            </div>
          )}
          {!isLoading && !error && (
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
              style={{ height: '100%' }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

