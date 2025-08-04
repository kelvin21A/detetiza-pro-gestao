import { useState, useMemo } from "react";
import { Plus, Edit, Eye, Calendar, User, Search, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from "@/components/layout/AppLayout";
import { useServiceCalls, ServiceCall, ServiceCallStatus } from "@/hooks/useServiceCalls";
import { useToast } from "@/components/ui/use-toast";

export default function Chamados() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { serviceCalls, isLoading, isError, deleteServiceCall } = useServiceCalls();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceCallStatus | 'todos'>('todos');

  const filteredCalls = useMemo(() => {
    return serviceCalls.filter(call => {
      const clientName = call.clients?.name || '';
      const matchesSearch = searchTerm === '' ||
        call.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (call.description && call.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        clientName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'todos' || call.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [serviceCalls, searchTerm, statusFilter]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getStatusBadge = (status: ServiceCallStatus | null) => {
    const statusMap: Record<NonNullable<ServiceCallStatus>, { label: string; variant: BadgeProps['variant'] }> = {
      'pending': { label: 'Pendente', variant: 'default' },
      'in_progress': { label: 'Em Andamento', variant: 'secondary' },
      'completed': { label: 'Concluído', variant: 'default' },
      'cancelled': { label: 'Cancelado', variant: 'destructive' },
    };
    const statusInfo = status ? statusMap[status] : null;
    if (!statusInfo) return <Badge variant="outline">Indefinido</Badge>;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteServiceCall(id);
      toast({
        title: "Chamado excluído com sucesso!",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir chamado",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const statusFilters: { value: ServiceCallStatus | 'todos', label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'in_progress', label: 'Em Andamento' },
    { value: 'completed', label: 'Concluídos' },
    { value: 'cancelled', label: 'Cancelados' },
  ];

  return (
    <AppLayout title="Chamados de Serviço">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chamados</h1>
            <p className="text-muted-foreground">Gerencie os chamados de serviço da sua equipe.</p>
          </div>
          <Button onClick={() => navigate('/chamados/novo')} className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Chamado
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, cliente..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {statusFilters.map(filter => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(filter.value)}
                className="shrink-0"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-16 w-16 animate-spin text-red-600" />
          </div>
        )}

        {isError && (
          <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg">
            <p className="text-red-600 font-semibold">Erro ao carregar os chamados.</p>
            <p className="text-muted-foreground">Tente novamente mais tarde.</p>
          </div>
        )}

        {!isLoading && !isError && filteredCalls.length > 0 && (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredCalls.map((call) => (
              <Card key={call.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold">{call.title}</h3>
                      <p className="text-sm text-muted-foreground">{call.clients?.name}</p>
                    </div>
                    {getStatusBadge(call.status)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 h-[40px]">{call.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(call.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{call.teams?.name || 'Não atribuído'}</span>
                    </div>
                  </div>
                </CardContent>
                <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/50">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/chamados/${call.id}`)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/chamados/editar/${call.id}`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(call.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !isError && filteredCalls.length === 0 && (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
             <div className="mx-auto w-16 h-16 text-muted-foreground mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Nenhum chamado encontrado</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'todos' ? 'Ajuste seus filtros ou crie um novo chamado.' : 'Comece criando um novo chamado de serviço.'}
            </p>
            <Button onClick={() => navigate('/chamados/novo')} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Chamado
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}