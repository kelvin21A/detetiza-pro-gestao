import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useWhatsApp } from "@/utils/whatsapp";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { 
    clients, 
    loading, 
    deleteClient, 
    setSearchTerm: setClientsSearchTerm,
    setStatusFilter: setClientsStatusFilter,
    refreshClients 
  } = useClients();
  
  const { sendWhatsAppMessage, isValidPhone } = useWhatsApp();

  // Atualiza os filtros no hook useClients quando mudam
  useEffect(() => {
    setClientsSearchTerm(searchTerm);
  }, [searchTerm, setClientsSearchTerm]);

  useEffect(() => {
    setClientsStatusFilter(statusFilter);
  }, [statusFilter, setClientsStatusFilter]);

  const handleWhatsAppClick = (client: any) => {
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
      message: `Olá ${client.name}, gostaria de falar sobre seus serviços de dedetização.`
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "em-dia":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">Em Dia</Badge>;
      case "proximo-vencimento":
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white">Próximo</Badge>;
      case "vencido":
        return <Badge variant="destructive" className="hover:bg-red-700">Vencido</Badge>;
      default:
        return <Badge variant="outline">Ativo</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      const { error } = await deleteClient(id);
      
      if (error) {
        toast.error('Erro ao excluir cliente', {
          description: error.message || 'Ocorreu um erro ao tentar excluir o cliente.'
        });
      } else {
        toast.success('Cliente excluído com sucesso!');
        refreshClients();
      }
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Lista de Clientes</h1>
          <Button asChild>
            <Link to="/clientes/novo" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar clientes por nome, telefone ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              disabled={loading}
              className="whitespace-nowrap"
            >
              <FilterX className="w-4 h-4 mr-2" />
              Todos
            </Button>
            <Button
              variant={statusFilter === "em-dia" ? "default" : "outline"}
              onClick={() => setStatusFilter("em-dia")}
              disabled={loading}
              className="whitespace-nowrap"
            >
              Em Dia
            </Button>
            <Button
              variant={statusFilter === "proximo-vencimento" ? "default" : "outline"}
              onClick={() => setStatusFilter("proximo-vencimento")}
              disabled={loading}
              className="whitespace-nowrap"
            >
              Próximos
            </Button>
            <Button
              variant={statusFilter === "vencido" ? "default" : "outline"}
              onClick={() => setStatusFilter("vencido")}
              disabled={loading}
              className="whitespace-nowrap"
            >
              Vencidos
            </Button>
          </div>

          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/clientes/novo">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
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
            clients.map((client) => (
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWhatsAppClick(client)}
                        title="Enviar mensagem"
                        className="text-foreground hover:text-primary"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        asChild
                        className="hover:text-primary"
                      >
                        <Link to={`/clientes/${client.id}`} title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        asChild
                        className="hover:text-primary"
                      >
                        <Link to={`/clientes/editar/${client.id}`} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(client.id)}
                        title="Excluir"
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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