import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Eye, Search, Filter, Calendar, User, MapPin, AlertTriangle, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useServiceCalls, ServiceCall } from '@/hooks/useServiceCalls';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Chamados() {
  const { toast } = useToast();
  const { serviceCalls, isLoading, isError, deleteServiceCall } = useServiceCalls();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const filteredCalls = useMemo(() => {
    if (!serviceCalls) return [];

    let updatedCalls = serviceCalls;

    if (statusFilter !== 'todos') {
      updatedCalls = updatedCalls.filter(call => call.status === statusFilter);
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      updatedCalls = updatedCalls.filter(call =>
        (call.clients?.name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (call.description?.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    return updatedCalls;
  }, [serviceCalls, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'in_progress':
        return <Badge variant="default">Em Andamento</Badge>;
      case 'completed':
        return <Badge variant="outline">Concluído</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este chamado?')) {
      deleteServiceCall(id, {
        onSuccess: () => toast({ description: 'Chamado excluído com sucesso!' }),
        onError: (error) => toast({ variant: 'destructive', title: 'Erro', description: error.message }),
      });
    }
  };

  const statusOptions = ['todos', 'pending', 'in_progress', 'completed'];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Chamados</h1>
        <Button asChild>
          <Link to="/chamados/novo"><Plus className="mr-2 h-4 w-4" /> Novo Chamado</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-muted-foreground" />
          {statusOptions.map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'secondary' : 'ghost'}
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Carregando chamados...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-red-500 bg-red-50 p-4 rounded-md">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">Erro ao carregar os chamados.</p>
          <p className="text-sm text-red-400">Tente recarregar a página ou contate o suporte.</p>
        </div>
      ) : filteredCalls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalls.map((call: ServiceCall) => (
            <Card key={call.id} className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <CardContent className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg">{call.clients?.name || 'Cliente não informado'}</h3>
                  {getStatusBadge(call.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-4 h-10 overflow-hidden">{call.description}</p>
                <div className="text-xs text-muted-foreground space-y-2">
                  {call.scheduled_date && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{new Date(call.scheduled_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {call.teams && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <span>Equipe: {call.teams.name || 'Não atribuída'}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-4 pt-0 flex justify-end gap-2 border-t mt-auto">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/chamados/${call.id}/editar`} title="Ver Detalhes"><Eye className="w-4 h-4" /></Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                   <Link to={`/chamados/${call.id}/editar`}><Edit className="w-4 h-4" /></Link>
                </Button>
                 <Button variant="ghost" size="sm" onClick={() => handleDelete(call.id)} className="text-destructive hover:text-destructive">
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Nenhum chamado encontrado</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm || statusFilter !== 'todos'
              ? 'Tente ajustar sua busca ou filtros.'
              : 'Clique em \'Novo Chamado\' para criar o primeiro.'}
          </p>
        </div>
      )}
    </div>
  );
}