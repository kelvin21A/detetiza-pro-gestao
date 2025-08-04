import { useState, useEffect } from "react";
import { Plus, Edit, Eye, CheckCircle, CheckCircle2, Calendar, User, MapPin, Search, Loader2, Trash2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { useServiceCalls, ServiceCallStatus, ServiceType } from "@/hooks/useServiceCalls";
import { useToast } from "@/hooks/use-toast";

interface ServiceCall {
  id: string;
  title: string;
  description: string;
  status: ServiceCallStatus;
  client?: {
    name: string;
    phone?: string;
    address?: string;
  };
  clients?: {
    name: string;
    address?: string;
  };
  teams?: {
    name: string;
  };
  scheduled_at?: string;
  scheduled_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  assigned_to?: string;
  address?: string;
  notes?: string;
  team_id?: string;
}

const SERVICE_CALL_STATUS = {
  pending: { label: 'Pendente', color: 'bg-yellow-500 hover:bg-yellow-600' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-500 hover:bg-blue-600' },
  completed: { label: 'Concluído', color: 'bg-green-500 hover:bg-green-600' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500 hover:bg-red-600' }
} as const;

const SERVICE_TYPES = {
  dedetization: 'Dedetização',
  desratization: 'Desratização',
  descupinization: 'Descupinização',
  sanitization: 'Sanitização',
  fumigation: 'Fumacê'
} as const;

export default function Chamados() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceCallStatus | 'todos'>("todos");
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<ServiceCall | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    serviceCalls,
    loading,
    error,
    fetchServiceCalls,
    deleteServiceCall,
    completeServiceCall,
    startServiceCall,
    getServiceCallsByStatus,
    getTodaysServiceCalls
  } = useServiceCalls();

  // Filter service calls based on search and status
  const filteredCalls = serviceCalls.filter(call => {
    const matchesSearch = searchTerm === '' || 
      (call.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'todos' || call.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Não agendado';
    
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Get status badge component
  const getStatusBadge = (status: ServiceCallStatus | null) => {
    if (!status) return null;
    
    const statusInfo = SERVICE_CALL_STATUS[status] || { label: status, color: 'bg-gray-500' };
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

  // Handle service call completion
  const handleCompleteServiceCall = async () => {
    if (!selectedCall?.id) return;
    
    try {
      setIsLoading(true);
      await completeServiceCall(selectedCall.id, completionNotes);
      toast({
        title: 'Sucesso!',
        description: 'Chamado marcado como concluído.',
      });
      setIsCompleteDialogOpen(false);
      setCompletionNotes('');
      await fetchServiceCalls();
    } catch (error) {
      console.error('Error completing service call:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir o chamado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle service call start
  const handleStartServiceCall = async (call: ServiceCall) => {
    if (!call.team_id) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma equipe antes de iniciar o atendimento.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await startServiceCall(call.id, call.team_id);
      toast({
        title: 'Sucesso!',
        description: 'Atendimento iniciado com sucesso.',
      });
      await fetchServiceCalls();
    } catch (error) {
      console.error('Error starting service call:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o atendimento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle service call deletion
  const handleDeleteServiceCall = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteServiceCall(id);
      toast({
        title: 'Sucesso!',
        description: 'Chamado excluído com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting service call:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o chamado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchServiceCalls();
      toast({
        title: 'Sucesso!',
        description: 'Lista de chamados atualizada.',
      });
    } catch (error) {
      console.error('Error refreshing service calls:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a lista de chamados.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch service calls on component mount and when filters change
  useEffect(() => {
    const loadServiceCalls = async () => {
      try {
        setIsLoading(true);
        if (statusFilter === 'todos') {
          await fetchServiceCalls({ search: searchTerm });
        } else {
          await getServiceCallsByStatus(statusFilter);
        }
      } catch (error) {
        console.error('Error loading service calls:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os chamados. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(() => {
      loadServiceCalls();
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [statusFilter, searchTerm, fetchServiceCalls, getServiceCallsByStatus, toast]);

  // Show loading state
  if (loading && serviceCalls.length === 0) {
    return (
      <AppLayout title="Chamados de Serviço">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <span className="ml-2">Carregando chamados...</span>
        </div>
      </AppLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AppLayout title="Chamados de Serviço">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar chamados</h3>
          <p className="text-gray-500 mb-6">Ocorreu um erro ao carregar a lista de chamados. Por favor, tente novamente.</p>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Tentar novamente
              </>
            )}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Chamados de Serviço">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Chamados</h1>
            <Button 
              onClick={() => navigate('/chamados/novo')} 
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Chamado
            </Button>
          </div>
          <p className="text-muted-foreground">Gerencie os chamados de serviço da sua equipe.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, endereço ou descrição..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => setStatusFilter(value as ServiceCallStatus)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "bg-primary text-primary-foreground" : ""}
              disabled={isLoading}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
              className={statusFilter === "pending" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
              disabled={isLoading}
            >
              Pendentes
            </Button>
            <Button
              variant={statusFilter === "in_progress" ? "default" : "outline"}
              onClick={() => setStatusFilter("in_progress")}
              className={statusFilter === "in_progress" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
              disabled={isLoading}
            >
              Em Andamento
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
              className={statusFilter === "completed" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
              disabled={isLoading}
            >
              Concluídos
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              onClick={() => setStatusFilter("cancelled")}
              className={statusFilter === "cancelled" ? "bg-gray-500 hover:bg-gray-600 text-white" : ""}
              disabled={isLoading}
            >
              Cancelados
            </Button>
          </div>
        </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>Atualizar</span>
          </Button>
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
              className={statusFilter === "pending" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
              disabled={isLoading}
            >
              Pendentes
            </Button>
            <Button
              variant={statusFilter === "in_progress" ? "default" : "outline"}
              onClick={() => setStatusFilter("in_progress")}
              className={statusFilter === "in_progress" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
              disabled={isLoading}
            >
              Em Andamento
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
              className={statusFilter === "completed" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
              disabled={isLoading}
            >
              Concluídos
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              onClick={() => setStatusFilter("cancelled")}
              className={statusFilter === "cancelled" ? "bg-gray-500 hover:bg-gray-600 text-white" : ""}
              disabled={isLoading}
            >
              Cancelados
            </Button>
          </div>
        </div>

      {/* Service Calls Grid */}
      <div className="grid gap-4">
        {filteredCalls.map((call) => (
          <Card key={call.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="font-semibold text-foreground text-lg">
                        {call.clients?.name || 'Cliente não especificado'}
                      </h3>
                      {getStatusBadge(call.status)}
                      <span className="text-sm text-muted-foreground">
                        #{call.id.substring(0, 6).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">{call.title || 'Sem título'}</h4>
                      <p className="text-muted-foreground">{call.description || 'Sem descrição'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mt-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-muted-foreground">Agendado para</div>
                          <div className="font-medium">{formatDate(call.scheduled_date)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-muted-foreground">Técnico</div>
                          <div className="font-medium">
                            {call.teams?.name || 'Não atribuído'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-muted-foreground">Local</div>
                          <div className="font-medium">
                            {call.clients?.address || 'Endereço não informado'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {call.notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          <strong>Observações:</strong> {call.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 justify-start"
                      onClick={() => navigate(`/chamados/${call.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 justify-start"
                      onClick={() => navigate(`/chamados/editar/${call.id}`)}
                      disabled={call.status === 'completed' || call.status === 'cancelled'}
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    
                    {call.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 justify-start text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleStartServiceCall(call)}
                        disabled={isLoading}
                      >
                        <PlayCircle className="w-4 h-4" />
                        Iniciar Atendimento
                      </Button>
                    )}
                    
                    {call.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 justify-start text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                        onClick={() => {
                          setSelectedCall(call);
                          setIsCompleteDialogOpen(true);
                        }}
                        disabled={isLoading}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Concluir Chamado
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 justify-start text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                      onClick={() => handleDeleteServiceCall(call.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && filteredCalls.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <div className="mx-auto w-16 h-16 text-muted-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">Nenhum chamado encontrado</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? 'Nenhum chamado corresponde à sua busca. Tente ajustar os filtros.'
              : 'Comece criando um novo chamado de serviço.'}
          </p>
          <Button 
            onClick={() => navigate('/chamados/novo')} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Chamado
          </Button>
        </div>
      )}
      
      {/* Completion Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Concluir Chamado</DialogTitle>
            <DialogDescription>
              Adicione observações sobre a conclusão deste chamado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="completionNotes">Observações</Label>
              <Textarea
                id="completionNotes"
                placeholder="Descreva o que foi feito..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serviceType">Tipo de Serviço</Label>
              <Select defaultValue="dedetization">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de serviço" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCompleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCompleteServiceCall}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Concluindo...
                </>
              ) : (
                'Confirmar Conclusão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}