import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Eye, Plus } from "lucide-react";
import { useState } from "react";

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  endereco: string;
  ultimoServico: string;
  proximaRenovacao: string;
  status: "em-dia" | "proximo" | "vencido";
}

const clientesData: Cliente[] = [
  {
    id: 1,
    nome: "Supermercado Central Ltda",
    telefone: "(11) 99999-9999",
    endereco: "Rua das Flores, 123 - Centro",
    ultimoServico: "15/08/2024",
    proximaRenovacao: "15/02/2025",
    status: "em-dia"
  },
  {
    id: 2,
    nome: "Restaurante Bom Sabor",
    telefone: "(11) 88888-8888", 
    endereco: "Av. Principal, 456 - Jardim",
    ultimoServico: "20/06/2024",
    proximaRenovacao: "20/12/2024",
    status: "proximo"
  },
  {
    id: 3,
    nome: "Padaria do João",
    telefone: "(11) 77777-7777",
    endereco: "Rua do Comércio, 789 - Vila",
    ultimoServico: "10/03/2024",
    proximaRenovacao: "10/09/2024",
    status: "vencido"
  }
];

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredClientes = clientesData.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || cliente.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "em-dia":
        return <Badge className="bg-success text-success-foreground">Em Dia</Badge>;
      case "proximo":
        return <Badge className="bg-warning text-warning-foreground">Próximo</Badge>;
      case "vencido":
        return <Badge className="bg-destructive text-destructive-foreground">Vencido</Badge>;
      default:
        return null;
    }
  };

  return (
    <AppLayout title="Clientes">
      {/* Barra de Ações */}
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
            variant={statusFilter === "proximo" ? "default" : "outline"}
            onClick={() => setStatusFilter("proximo")}
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

        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Lista de Clientes */}
      <div className="grid gap-4">
        {filteredClientes.map((cliente) => (
          <Card key={cliente.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{cliente.nome}</h3>
                    {getStatusBadge(cliente.status)}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Telefone:</span> {cliente.telefone}
                    </div>
                    <div>
                      <span className="font-medium">Último Serviço:</span> {cliente.ultimoServico}
                    </div>
                    <div>
                      <span className="font-medium">Próxima Renovação:</span>{" "}
                      <span className={cliente.status !== "em-dia" ? "text-destructive font-medium" : ""}>
                        {cliente.proximaRenovacao}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium">Endereço:</span> {cliente.endereco}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}