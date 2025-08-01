import { useState } from "react";
import { Plus, Edit, Eye, CheckCircle, Calendar, User, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_SERVICE_CALLS, SERVICE_CALL_STATUS, SERVICE_TYPES, ServiceCall } from "@/data/mockData";

export default function Chamados() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredCalls = MOCK_SERVICE_CALLS.filter(call => {
    const matchesSearch = call.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || call.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: keyof typeof SERVICE_CALL_STATUS) => {
    const statusInfo = SERVICE_CALL_STATUS[status];
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chamados de Serviço</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os chamados e agendamentos de serviços
          </p>
        </div>
        
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Chamado
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
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
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">{call.client_name}</h3>
                    {getStatusBadge(call.status)}
                  </div>
                  
                  <p className="text-gray-700 mb-3 font-medium">{call.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Data/Hora:</span>
                      <span className="text-gray-900 font-medium">{formatDate(call.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Técnico:</span>
                      <span className="text-gray-900 font-medium">{call.team_member_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Local:</span>
                      <span className="text-gray-900 font-medium">{call.address}</span>
                    </div>
                  </div>
                  
                  {call.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">
                        <strong>Observações:</strong> {call.notes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {(call.status === "pending" || call.status === "in_progress") && (
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCalls.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum chamado encontrado
          </h3>
          <p className="text-gray-600">
            {searchTerm ? "Tente ajustar sua busca" : "Nenhum chamado cadastrado ainda"}
          </p>
        </div>
      )}
    </div>
  );
}