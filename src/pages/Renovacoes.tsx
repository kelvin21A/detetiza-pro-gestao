import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Calendar } from "lucide-react";
import { useState } from "react";
import { useWhatsApp } from "@/utils/whatsapp";
import { toast } from "sonner";
import { MOCK_CLIENTS } from "@/data/mockData";

interface Renovacao {
  id: number;
  cliente: string;
  ultimoServico: string;
  vencimento: string;
  status: "vencido" | "proximo" | "em-dia";
  diasRestantes: number;
}

const renovacoesData: Renovacao[] = [
  {
    id: 1,
    cliente: "Padaria do João",
    ultimoServico: "10/03/2024",
    vencimento: "10/09/2024",
    status: "vencido",
    diasRestantes: -45
  },
  {
    id: 2,
    cliente: "Restaurante Bom Sabor",
    ultimoServico: "20/06/2024",
    vencimento: "20/12/2024",
    status: "proximo",
    diasRestantes: 15
  },
  {
    id: 3,
    cliente: "Mercadinho da Esquina",
    ultimoServico: "05/07/2024",
    vencimento: "05/01/2025",
    status: "proximo",
    diasRestantes: 28
  },
  {
    id: 4,
    cliente: "Supermercado Central Ltda",
    ultimoServico: "15/08/2024",
    vencimento: "15/02/2025",
    status: "em-dia",
    diasRestantes: 75
  }
];

export default function Renovacoes() {
  const [statusFilter, setStatusFilter] = useState("todos");
  const { sendWhatsAppMessage, isValidPhone } = useWhatsApp();

  const handleWhatsAppClick = (renovacao: Renovacao) => {
    // Find client phone from mock data
    const client = MOCK_CLIENTS.find(c => c.name === renovacao.cliente);
    
    if (!client || !client.phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    if (!isValidPhone(client.phone)) {
      toast.error('Número de telefone inválido');
      return;
    }

    // Generate renewal message based on status
    let message = '';
    if (renovacao.status === 'vencido') {
      message = `Olá ${renovacao.cliente}, seu contrato de dedetização venceu há ${Math.abs(renovacao.diasRestantes)} dias. Entre em contato conosco para renovar!`;
    } else if (renovacao.status === 'proximo') {
      message = `Olá ${renovacao.cliente}, seu contrato de dedetização vence em ${renovacao.diasRestantes} dias. Entre em contato conosco para renovar!`;
    } else {
      message = `Olá ${renovacao.cliente}, gostaria de falar sobre a renovação do seu contrato de dedetização.`;
    }

    sendWhatsAppMessage({
      phone: client.phone,
      clientName: renovacao.cliente,
      message: message
    });

    toast.success('WhatsApp aberto com sucesso!');
  };

  const filteredRenovacoes = renovacoesData.filter(renovacao => {
    if (statusFilter === "todos") return true;
    if (statusFilter === "proximos-30") return renovacao.diasRestantes <= 30 && renovacao.diasRestantes > 0;
    return renovacao.status === statusFilter;
  });

  const getStatusInfo = (renovacao: Renovacao) => {
    if (renovacao.status === "vencido") {
      return {
        badge: <Badge className="bg-destructive text-destructive-foreground">Vencido</Badge>,
        message: `${Math.abs(renovacao.diasRestantes)} dias em atraso`
      };
    } else if (renovacao.status === "proximo") {
      return {
        badge: <Badge className="bg-warning text-warning-foreground">Próximo</Badge>,
        message: `${renovacao.diasRestantes} dias restantes`
      };
    } else {
      return {
        badge: <Badge className="bg-success text-success-foreground">Em Dia</Badge>,
        message: `${renovacao.diasRestantes} dias restantes`
      };
    }
  };

  return (
    <AppLayout title="Renovações">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={statusFilter === "proximos-30" ? "default" : "outline"}
          onClick={() => setStatusFilter("proximos-30")}
          className={statusFilter === "proximos-30" ? "bg-primary text-primary-foreground" : ""}
        >
          Próximos 30 Dias
        </Button>
        <Button
          variant={statusFilter === "vencido" ? "default" : "outline"}
          onClick={() => setStatusFilter("vencido")}
          className={statusFilter === "vencido" ? "bg-destructive text-destructive-foreground" : ""}
        >
          Vencidos
        </Button>
        <Button
          variant={statusFilter === "em-dia" ? "default" : "outline"}
          onClick={() => setStatusFilter("em-dia")}
        >
          Em Dia
        </Button>
        <Button
          variant={statusFilter === "todos" ? "default" : "outline"}
          onClick={() => setStatusFilter("todos")}
        >
          Todos
        </Button>
      </div>

      {/* Lista de Renovações */}
      <div className="grid gap-4">
        {filteredRenovacoes.map((renovacao) => {
          const statusInfo = getStatusInfo(renovacao);
          return (
            <Card 
              key={renovacao.id} 
              className={`hover:shadow-md transition-shadow ${
                renovacao.status === "vencido" ? "border-l-4 border-l-destructive" : 
                renovacao.status === "proximo" ? "border-l-4 border-l-warning" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-foreground text-lg">{renovacao.cliente}</h3>
                      {statusInfo.badge}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Último Serviço:</span>
                        <span className="text-foreground font-medium">{renovacao.ultimoServico}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Vencimento:</span>
                        <span className={`font-medium ${
                          renovacao.status === "vencido" || renovacao.status === "proximo" 
                            ? "text-destructive" 
                            : "text-foreground"
                        }`}>
                          {renovacao.vencimento}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className={`font-medium ${
                        renovacao.status === "vencido" ? "text-destructive" :
                        renovacao.status === "proximo" ? "text-warning" : "text-success"
                      }`}>
                        {statusInfo.message}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      className="bg-green-600 text-white hover:bg-green-700"
                      size="sm"
                      onClick={() => handleWhatsAppClick(renovacao)}
                      title="Enviar mensagem WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRenovacoes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma renovação encontrada para o filtro selecionado.</p>
        </div>
      )}
    </AppLayout>
  );
}