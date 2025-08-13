import { Calendar, dateFnsLocalizer, Views, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PlusCircle, Loader2, MapPin, Clock, FileText, DollarSign, User, Users, CalendarClock, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useTeams } from '@/hooks/useTeams';
import { useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Função para traduzir os status dos agendamentos
const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    scheduled: 'Agendado',
    completed: 'Concluído',
    invoiced: 'Faturado',
    paid: 'Pago',
    canceled: 'Cancelado'
  };
  return statusMap[status] || status;
};

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
  noEventsInRange: 'Não há agendamentos neste período.',
  showMore: (total: number) => `+ Ver mais (${total})`,
};

// Mapeamento de status para cores
const statusColors = {
  scheduled: '#3498db', // Azul
  completed: '#2ecc71', // Verde
  invoiced: '#f39c12',  // Laranja
  paid: '#27ae60',      // Verde escuro
  canceled: '#e74c3c',  // Vermelho
};

// Cores para os badges de status
const statusBadgeColors = {
  scheduled: 'bg-blue-500 hover:bg-blue-600',
  completed: 'bg-green-500 hover:bg-green-600',
  invoiced: 'bg-amber-500 hover:bg-amber-600',
  paid: 'bg-emerald-600 hover:bg-emerald-700',
  canceled: 'bg-red-500 hover:bg-red-600',
};

// Interface para os eventos do calendário
interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status?: string;
  client?: string;
  team?: string;
  description?: string;
  value?: string;
  appointmentData: Appointment;
}

export default function Agenda() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { appointments, isLoading, error, deleteAppointment } = useAppointments();
  const { teams } = useTeams();
  const [selectedView, setSelectedView] = useState<string>(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterTeamId, setFilterTeamId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Converter os agendamentos para o formato de eventos do calendário e aplicar filtros
  const events = useMemo(() => {
    if (!appointments) return [];
    
    // Aplicar filtros
    const filteredAppointments = appointments.filter(appointment => {
      // Filtrar por equipe
      if (filterTeamId && appointment.team_id !== filterTeamId) {
        return false;
      }
      
      // Filtrar por status
      if (filterStatus && appointment.status !== filterStatus) {
        return false;
      }
      
      return true;
    });
    
    return filteredAppointments.map((appointment): CalendarEvent => {
      // Converter a string de data para objeto Date
      const start = appointment.scheduled_date ? parseISO(appointment.scheduled_date) : new Date();
      
      // Calcular a data de término com base na duração estimada
      const durationHours = appointment.estimated_duration || 1; // Padrão: 1 hora
      const end = appointment.scheduled_date ? addHours(parseISO(appointment.scheduled_date), durationHours) : addHours(new Date(), durationHours);
      
      // Formatar o valor como moeda brasileira
      const formattedValue = appointment.value 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(appointment.value))
        : undefined;
      
      return {
        id: appointment.id,
        title: appointment.clients?.name || 'Cliente não especificado',
        start,
        end,
        status: appointment.status || 'scheduled',
        client: appointment.clients?.name,
        team: appointment.teams?.name,
        description: appointment.description || '',
        value: formattedValue,
        address: appointment.address,
        notes: appointment.notes,
        appointmentData: appointment,
      };
    });
  }, [appointments, filterTeamId, filterStatus]);

  // Manipulador para clicar em um evento
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  }, []);

  // Manipulador para criar um novo agendamento
  const handleNewAppointment = () => {
    navigate('/novo-agendamento');
  };

  // Estilização dos eventos baseada no status
  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const backgroundColor = statusColors[event.status as keyof typeof statusColors] || '#3498db';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: '#fff',
        border: '0px',
        display: 'block',
      },
    };
  }, []);

  // Formatação do título do evento
  const formats = {
    eventTimeRangeFormat: () => '',
  };

  if (error) {
    toast({
      title: 'Erro ao carregar agendamentos',
      description: 'Não foi possível carregar os agendamentos. Tente novamente mais tarde.',
      variant: 'destructive',
    });
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Agenda Gerencial</h1>
          <p className="text-muted-foreground">Visualize e gerencie os agendamentos de serviços.</p>
        </div>
        <Button onClick={handleNewAppointment}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="p-4 pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={selectedView === Views.MONTH ? "default" : "outline"}
                onClick={() => setSelectedView(Views.MONTH)}
                size="sm"
              >
                Mês
              </Button>
              <Button
                variant={selectedView === Views.WEEK ? "default" : "outline"}
                onClick={() => setSelectedView(Views.WEEK)}
                size="sm"
              >
                Semana
              </Button>
              <Button
                variant={selectedView === Views.DAY ? "default" : "outline"}
                onClick={() => setSelectedView(Views.DAY)}
                size="sm"
              >
                Dia
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Filtrar por Equipe</h4>
                      <Select
                        value={filterTeamId}
                        onValueChange={setFilterTeamId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as equipes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas as equipes</SelectItem>
                          {teams?.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Filtrar por Status</h4>
                      <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os status</SelectItem>
                          <SelectItem value="scheduled">Agendado</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="invoiced">Faturado</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="canceled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        setFilterTeamId('');
                        setFilterStatus('');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button onClick={handleCreateAppointment} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Agendamento
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando agendamentos...</span>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView={Views.MONTH}
              view={selectedView as any}
              onView={(view) => setSelectedView(view)}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              messages={messages}
              culture='pt-BR'
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventPropGetter as any}
              formats={formats}
              popup
              tooltipAccessor={(event: CalendarEvent) => {
                const lines = [
                  `Cliente: ${event.client || 'Não especificado'}`,
                  event.team ? `Equipe: ${event.team}` : 'Sem equipe designada',
                  `Status: ${getStatusLabel(event.status || 'scheduled')}`,
                  event.description ? `Descrição: ${event.description}` : '',
                  event.value ? `Valor: ${event.value}` : '',
                  event.address ? `Local: ${event.address}` : '',
                  event.notes ? `Obs: ${event.notes}` : ''
                ];
                return lines.filter(line => line).join('\n');
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog para exibir detalhes do agendamento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedEvent && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Detalhes do Agendamento
              </DialogTitle>
              <DialogDescription>
                {format(selectedEvent.start, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <Badge className={statusBadgeColors[selectedEvent.status || 'scheduled']}>
                  {getStatusLabel(selectedEvent.status || 'scheduled')}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Cliente:</span> {selectedEvent.client || 'Não especificado'}
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Equipe:</span> {selectedEvent.team || 'Não designada'}
              </div>

              {selectedEvent.description && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="font-medium">Descrição:</span>
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>
                </div>
              )}

              {selectedEvent.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="font-medium">Local:</span>
                    <p className="text-sm">{selectedEvent.address}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Duração:</span> 
                {selectedEvent.appointmentData.estimated_duration 
                  ? `${selectedEvent.appointmentData.estimated_duration} hora(s)` 
                  : '1 hora'}
              </div>

              {selectedEvent.value && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Valor:</span> {selectedEvent.value}
                </div>
              )}

              {selectedEvent.notes && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="font-medium">Observações:</span>
                    <p className="text-sm">{selectedEvent.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="flex-1">
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
                      setIsDeleting(true);
                      try {
                        await deleteAppointment(selectedEvent.id);
                        toast({
                          title: 'Agendamento excluído',
                          description: 'O agendamento foi excluído com sucesso.',
                        });
                        setIsDialogOpen(false);
                      } catch (error) {
                        toast({
                          title: 'Erro',
                          description: 'Não foi possível excluir o agendamento.',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsDeleting(false);
                      }
                    }
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Fechar</Button>
                <Button onClick={() => {
                  setIsDialogOpen(false);
                  navigate(`/agenda/${selectedEvent.id}/editar`);
                }}>Editar</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
