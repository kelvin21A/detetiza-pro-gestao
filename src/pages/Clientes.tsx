import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Eye, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Loader2,
  AlertCircle,
  FilterX
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useWhatsApp } from "@/utils/whatsapp";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Database } from "@/types/database.types";

type Client = Database['public']['Tables']['clients']['Row'];

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const { clients, isLoading, deleteClient } = useClients();
  const { sendWhatsAppMessage, isValidPhone } = useWhatsApp();

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((client) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = term
        ? client.name.toLowerCase().includes(term) ||
          (client.email && client.email.toLowerCase().includes(term)) ||
          (client.phone && client.phone.includes(term))
        : true;

      const matchesStatus = statusFilter !== 'todos' ? client.status === statusFilter : true;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const handleWhatsAppClick = (client: Client) => {
    if (!client.phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }
    if (!isValidPhone(client.phone)) {
      toast.error('Número de telefone inválido');
      return;
    }
    sendWhatsAppMessage({
      phone: client.phone,
      clientName: client.name,
      message: `Olá ${client.name}, gostaria de falar sobre seus serviços.`
    });
  };

      const getStatusBadge = (status: Client['status']) => {
    const statusMap: Record<NonNullable<Client['status']>, { label: string; variant: BadgeProps['variant'] }> = {
      'em-dia': { label: 'Em Dia', variant: 'default' },
      'proximo': { label: 'Próximo', variant: 'secondary' },
      'vencido': { label: 'Vencido', variant: 'destructive' },
    };

    const statusInfo = status ? statusMap[status] : null;

    if (!statusInfo) {
      return <Badge variant="outline">Ativo</Badge>;
    }

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteClient(id, {
        onSuccess: () => toast.success('Cliente excluído com sucesso!'),
        onError: (error) => toast.error(`Falha ao excluir cliente: ${error.message}`),
      });
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <AppLayout title="Clientes">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Lista de Clientes</h1>
          <Button asChild>
            <Link to="/clientes/novo" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant={statusFilter === "todos" ? "default" : "outline"} onClick={() => setStatusFilter("todos")} disabled={isLoading} className="whitespace-nowrap"><FilterX className="w-4 h-4 mr-2" />Todos</Button>
            <Button variant={statusFilter === "em-dia" ? "default" : "outline"} onClick={() => setStatusFilter("em-dia")} disabled={isLoading} className="whitespace-nowrap">Em Dia</Button>
            <Button variant={statusFilter === "proximo" ? "default" : "outline"} onClick={() => setStatusFilter("proximo")} disabled={isLoading} className="whitespace-nowrap">Próximos</Button>
            <Button variant={statusFilter === "vencido" ? "default" : "outline"} onClick={() => setStatusFilter("vencido")} disabled={isLoading} className="whitespace-nowrap">Vencidos</Button>
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'todos' 
                  ? 'Nenhum cliente corresponde aos filtros atuais.'
                  : 'Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.'}
              </p>
              <Button asChild className="mt-4">
                <Link to="/clientes/novo" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Cliente
                </Link>
              </Button>
            </div>
          ) : (
            filteredClients.map((client) => (
              <Card key={client.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold truncate">{client.name}</h3>
                        <div className="flex-shrink-0">
                          {getStatusBadge(client.status)}
                        </div>
                      </div>
                      {client.email && (
                        <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      )}
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleWhatsAppClick(client)} title="Enviar mensagem" className="text-foreground hover:text-primary"><MessageCircle className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary"><Link to={`/clientes/${client.id}`} title="Ver detalhes"><Eye className="h-4 w-4" /></Link></Button>
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary"><Link to={`/clientes/editar/${client.id}`} title="Editar"><Edit className="h-4 w-4" /></Link></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} title="Excluir" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}