import { useState } from "react";
import { Plus, Edit, Eye, CheckCircle2, Calendar, User, MapPin, Search, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

// Simple mock data for demo
const mockServiceCalls = [
  {
    id: "1",
    title: "Dedetização Comercial",
    description: "Aplicação preventiva em estabelecimento comercial",
    status: "pending",
    clients: { name: "Padaria Central", address: "Rua das Flores, 123" },
    teams: { name: "Equipe A" },
    scheduled_date: "2024-01-20T14:00:00Z",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    organization_id: "1"
  }
];

const SERVICE_CALL_STATUS = {
  pending: { label: 'Pendente', color: 'bg-yellow-500' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-500' },
  completed: { label: 'Concluído', color: 'bg-green-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' }
};

export default function Chamados() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [serviceCalls] = useState(mockServiceCalls);

  const filteredCalls = serviceCalls.filter(call => {
    const matchesSearch = searchTerm === '' || 
      call.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.clients.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || call.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = SERVICE_CALL_STATUS[status] || { label: status, color: 'bg-gray-500' };
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

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
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "todos" ? "default" : "outline"}
              onClick={() => setStatusFilter("todos")}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
            >
              Pendentes
            </Button>
            <Button
              variant={statusFilter === "in_progress" ? "default" : "outline"}
              onClick={() => setStatusFilter("in_progress")}
            >
              Em Andamento
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
            >
              Concluídos
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
                        {call.clients.name}
                      </h3>
                      {getStatusBadge(call.status)}
                      <span className="text-sm text-muted-foreground">
                        #{call.id.substring(0, 6).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">{call.title}</h4>
                      <p className="text-muted-foreground">{call.description}</p>
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
                            {call.teams.name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-muted-foreground">Local</div>
                          <div className="font-medium">
                            {call.clients.address}
                          </div>
                        </div>
                      </div>
                    </div>
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
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 justify-start text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCalls.length === 0 && (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <div className="mx-auto w-16 h-16 text-muted-foreground mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Nenhum chamado encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Comece criando um novo chamado de serviço.
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
      </div>
    </AppLayout>
  );
}