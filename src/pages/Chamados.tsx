import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Eye, CheckCircle, Calendar, User, MapPin } from "lucide-react";
import { useState } from "react";

interface Chamado {
  id: number;
  cliente: string;
  descricao: string;
  dataAgendada: string;
  equipe: string;
  status: "aberto" | "agendado" | "andamento" | "concluido";
  endereco: string;
}

const chamadosData: Chamado[] = [
  {
    id: 1,
    cliente: "Supermercado Central Ltda",
    descricao: "Dedetização completa - Renovação semestral",
    dataAgendada: "15/12/2024 09:00",
    equipe: "Equipe Alpha",
    status: "agendado",
    endereco: "Rua das Flores, 123 - Centro"
  },
  {
    id: 2,
    cliente: "Restaurante Bom Sabor",
    descricao: "Controle de pragas - Cozinha e depósito",
    dataAgendada: "18/12/2024 14:00",
    equipe: "Equipe Beta",
    status: "andamento",
    endereco: "Av. Principal, 456 - Jardim"
  },
  {
    id: 3,
    cliente: "Padaria do João",
    descricao: "Dedetização urgente - Detecção de roedores",
    dataAgendada: "20/12/2024 08:00",
    equipe: "Equipe Alpha",
    status: "aberto",
    endereco: "Rua do Comércio, 789 - Vila"
  },
  {
    id: 4,
    cliente: "Mercadinho da Esquina",
    descricao: "Renovação de laudo sanitário",
    dataAgendada: "10/12/2024 10:00",
    equipe: "Equipe Beta",
    status: "concluido",
    endereco: "Rua da Esquina, 321 - Bairro"
  }
];

export default function Chamados() {
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredChamados = chamadosData.filter(chamado => {
    return statusFilter === "todos" || chamado.status === statusFilter;
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "aberto":
        return {
          badge: <Badge className="bg-destructive text-destructive-foreground">Em Aberto</Badge>,
          color: "border-l-destructive"
        };
      case "agendado":
        return {
          badge: <Badge className="bg-warning text-warning-foreground">Agendado</Badge>,
          color: "border-l-warning"
        };
      case "andamento":
        return {
          badge: <Badge className="bg-blue-500 text-white">Em Andamento</Badge>,
          color: "border-l-blue-500"
        };
      case "concluido":
        return {
          badge: <Badge className="bg-success text-success-foreground">Concluído</Badge>,
          color: "border-l-success"
        };
      default:
        return {
          badge: <Badge>Indefinido</Badge>,
          color: ""
        };
    }
  };

  return (
    <AppLayout title="Chamados">
      {/* Barra de Ações */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "todos" ? "default" : "outline"}
            onClick={() => setStatusFilter("todos")}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "aberto" ? "default" : "outline"}
            onClick={() => setStatusFilter("aberto")}
            className={statusFilter === "aberto" ? "bg-destructive text-destructive-foreground" : ""}
          >
            Em Aberto
          </Button>
          <Button
            variant={statusFilter === "agendado" ? "default" : "outline"}
            onClick={() => setStatusFilter("agendado")}
          >
            Agendados
          </Button>
          <Button
            variant={statusFilter === "andamento" ? "default" : "outline"}
            onClick={() => setStatusFilter("andamento")}
          >
            Em Andamento
          </Button>
          <Button
            variant={statusFilter === "concluido" ? "default" : "outline"}
            onClick={() => setStatusFilter("concluido")}
          >
            Concluídos
          </Button>
        </div>

        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 ml-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Chamado
        </Button>
      </div>

      {/* Lista de Chamados */}
      <div className="grid gap-4">
        {filteredChamados.map((chamado) => {
          const statusInfo = getStatusInfo(chamado.status);
          return (
            <Card 
              key={chamado.id} 
              className={`hover:shadow-md transition-shadow border-l-4 ${statusInfo.color}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-foreground text-lg">{chamado.cliente}</h3>
                      {statusInfo.badge}
                    </div>
                    
                    <p className="text-foreground mb-3 font-medium">{chamado.descricao}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Data/Hora:</span>
                        <span className="text-foreground font-medium">{chamado.dataAgendada}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Equipe:</span>
                        <span className="text-foreground font-medium">{chamado.equipe}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Local:</span>
                        <span className="text-foreground font-medium">{chamado.endereco}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {(chamado.status === "agendado" || chamado.status === "andamento") && (
                      <Button 
                        size="sm"
                        className="bg-success text-success-foreground hover:bg-success/90"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredChamados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum chamado encontrado para o filtro selecionado.</p>
        </div>
      )}
    </AppLayout>
  );
}