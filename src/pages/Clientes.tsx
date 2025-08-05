import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Eye, Search, Filter, Edit, Trash, Plus, WhatsAppIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useClients, Client } from "@/hooks/useClients";
import { useWhatsApp } from "@/utils/whatsapp";
import { Loader2 } from "lucide-react";

export default function Clientes() {
  const { toast } = useToast();
  const { clients, isLoading, isError, deleteClient } = useClients();
  const { isValidPhone } = useWhatsApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const filteredClients = useMemo(() => {
    if (!clients) return [];

    let updatedClients = clients;

    if (statusFilter !== 'todos') {
      updatedClients = updatedClients.filter(client => client.status === statusFilter);
    }

    if (searchTerm) {
      updatedClients = updatedClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone || '').includes(searchTerm)
      );
    }

    return updatedClients;
  }, [clients, searchTerm, statusFilter]);

  const handleWhatsAppClick = (client: Client) => {
    if (!client.phone || !isValidPhone(client.phone)) {
      toast({ title: 'Atenção', description: 'O número de WhatsApp do cliente não é válido ou não foi cadastrado.' });
      return;
    }
    const message = encodeURIComponent(`Olá, ${client.name}! Tudo bem? Entramos em contato a respeito dos seus serviços com a DetetizaPro.`);
    const url = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${message}`;
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "em-dia":
        return <Badge variant="default">Em dia</Badge>;
      case "a-vencer":
        return <Badge variant="secondary">A vencer</Badge>;
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      await deleteClient(id);
    }
  };

  const statusFilters = ['todos', 'em-dia', 'a-vencer', 'vencido'];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button asChild>
          <Link to="/clientes/novo"><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-muted-foreground" />
          {statusFilters.map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? "secondary" : "ghost"}
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-2">Carregando clientes...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">Erro ao carregar os clientes.</p>
            <p className="text-muted-foreground text-sm">Tente recarregar a página.</p>
          </div>
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-foreground">{client.name}</h3>
                      {getStatusBadge(client.status)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {client.phone && <div><strong>Telefone:</strong> {client.phone}</div>}
                      {client.email && <div><strong>Email:</strong> {client.email}</div>}
                      {client.address && <div className="col-span-full"><strong>Endereço:</strong> {client.address}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleWhatsAppClick(client)}
                      title="Enviar mensagem WhatsApp"
                    >
                      <Button size="sm" className="w-full justify-start bg-green-500 hover:bg-green-600 text-white">
                        <WhatsAppIcon className="mr-2 h-4 w-4" />
                        WhatsApp
                      </Button>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-foreground hover:text-primary" asChild>
                      <Link to={`/clientes/${client.id}/editar`} title="Editar Cliente">
                        <Edit className="w-5 h-5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-foreground hover:text-primary" asChild>
                      <Link to={`/clientes/${client.id}/editar`} title="Ver Detalhes">
                        <Eye className="w-5 h-5" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(client.id)}
                      className="text-destructive hover:text-destructive hover:bg-red-50"
                      title="Excluir Cliente"
                    >
                      <Trash className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm || statusFilter !== 'todos' 
                ? "Tente ajustar sua busca ou filtros."
                : "Clique em 'Novo Cliente' para começar a cadastrar."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}