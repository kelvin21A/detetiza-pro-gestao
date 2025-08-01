import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Eye, Search, Filter, Plus, Edit, Trash } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useClients } from "@/hooks/useClients";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const { clients, loading, deleteClient } = useClients();

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.phone || '').includes(searchTerm) ||
                         (client.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "em-dia":
        return <Badge variant="default" className="bg-primary text-primary-foreground">Em Dia</Badge>;
      case "proximo-vencimento":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Próximo</Badge>;
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="outline">Ativo</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteClient(id);
    }
  };

  return (
    <AppLayout title="Clientes">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar clientes..."
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
              variant={statusFilter === "em-dia" ? "default" : "outline"}
              onClick={() => setStatusFilter("em-dia")}
            >
              Em Dia
            </Button>
            <Button
              variant={statusFilter === "proximo-vencimento" ? "default" : "outline"}
              onClick={() => setStatusFilter("proximo-vencimento")}
            >
              Próximos
            </Button>
            <Button
              variant={statusFilter === "vencido" ? "default" : "outline"}
              onClick={() => setStatusFilter("vencido")}
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

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando clientes...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{client.name}</h3>
                        {getStatusBadge(client.status)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        {client.phone && (
                          <div>
                            <span className="font-medium">Telefone:</span> {client.phone}
                          </div>
                        )}
                        {client.last_service_date && (
                          <div>
                            <span className="font-medium">Último Serviço:</span> {new Date(client.last_service_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {client.next_renewal_date && (
                          <div>
                            <span className="font-medium">Próxima Renovação:</span>{" "}
                            <span className={client.status !== "em-dia" ? "text-destructive font-medium" : ""}>
                              {new Date(client.next_renewal_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                      {client.address && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium">Endereço:</span> {client.address}
                        </div>
                      )}
                      {client.email && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium">Email:</span> {client.email}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-foreground hover:text-primary" asChild>
                        <Link to={`/clientes/${client.id}/editar`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(client.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredClients.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "todos" 
                ? "Nenhum cliente encontrado com os filtros aplicados." 
                : "Nenhum cliente cadastrado. Clique em 'Novo Cliente' para começar."
              }
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}