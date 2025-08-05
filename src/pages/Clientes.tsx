import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Eye, Search, Filter, Edit, Trash, Plus, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useClients, Client } from "@/hooks/useClients";
import { useWhatsApp } from "@/utils/whatsapp";
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';

export default function Clientes() {
  const { toast } = useToast();
  const { clients, isLoading, isError, deleteClient } = useClients();
  const { isValidPhone, sendMessage } = useWhatsApp();

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
    sendMessage({
      phone: client.phone,
      clientName: client.name,
      message: `Olá, ${client.name}! Tudo bem? Entramos em contato a respeito dos seus serviços com a DetetizaPro.`
    });
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
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <Button asChild>
          <Link to="/clientes/novo"><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    {getStatusBadge(client.status)}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                  {client.phone && <p><strong>Telefone:</strong> {client.phone}</p>}
                  {client.email && <p><strong>Email:</strong> {client.email}</p>}
                  {client.address && <p><strong>Endereço:</strong> {client.address}</p>}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-4 border-t">
                  <WhatsAppButton 
                    onClick={() => handleWhatsAppClick(client)}
                    text="WhatsApp"
                  />
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/clientes/${client.id}/editar`}><Edit className="w-4 h-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="text-destructive hover:text-destructive">
                    <Trash className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
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