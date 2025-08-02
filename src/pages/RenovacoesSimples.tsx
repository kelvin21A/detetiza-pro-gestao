import React, { useState } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MessageCircle,
  Phone,
  Mail,
  DollarSign
} from "lucide-react";
import { toast } from 'sonner';

// Dados mockados para demonstração
const mockContracts = [
  {
    id: '1',
    client: {
      name: 'Restaurante Bom Sabor',
      email: 'contato@bomsabor.com',
      phone: '(11) 99999-1111',
      address: 'Rua das Flores, 123'
    },
    end_date: '2024-02-15',
    value: 850.00,
    status: 'active'
  },
  {
    id: '2',
    client: {
      name: 'Padaria Central',
      email: 'admin@padariacentral.com',
      phone: '(11) 99999-2222',
      address: 'Av. Principal, 456'
    },
    end_date: '2024-01-28',
    value: 650.00,
    status: 'active'
  },
  {
    id: '3',
    client: {
      name: 'Hotel Vista Mar',
      email: 'gerencia@hotelvistamar.com',
      phone: '(11) 99999-3333',
      address: 'Rua da Praia, 789'
    },
    end_date: '2024-03-10',
    value: 1200.00,
    status: 'active'
  }
];

export default function RenovacoesSimples() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getDaysUntilExpiration = (endDate: string): number => {
    const today = new Date();
    const expiration = new Date(endDate);
    const diffTime = expiration.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getContractStatus = (endDate: string): 'expired' | 'expiring_soon' | 'active' => {
    const daysLeft = getDaysUntilExpiration(endDate);
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring_soon';
    return 'active';
  };

  const filteredContracts = mockContracts.filter(contract => {
    const matchesSearch = 
      contract.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client.phone.includes(searchTerm);
    
    if (statusFilter === "all") return matchesSearch;
    
    const contractStatus = getContractStatus(contract.end_date);
    if (statusFilter === "expired" && contractStatus === 'expired') return matchesSearch;
    if (statusFilter === "expiring_soon" && contractStatus === 'expiring_soon') return matchesSearch;
    if (statusFilter === "active" && contractStatus === 'active') return matchesSearch;
    
    return false;
  });

  const getStatusBadge = (endDate: string) => {
    const status = getContractStatus(endDate);
    const daysLeft = getDaysUntilExpiration(endDate);
    
    switch (status) {
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Vencido ({Math.abs(daysLeft)} dias)
          </Badge>
        );
      case "expiring_soon":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Vence em {daysLeft} dias
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo ({daysLeft} dias)
          </Badge>
        );
    }
  };

  const handleWhatsAppContact = (contract: any) => {
    const daysLeft = getDaysUntilExpiration(contract.end_date);
    const status = getContractStatus(contract.end_date);
    
    let message = '';
    if (status === 'expired') {
      message = `Olá ${contract.client.name}! Seu contrato de dedetização venceu há ${Math.abs(daysLeft)} dias. Gostaria de renovar seus serviços? Entre em contato conosco para não ficar desprotegido!`;
    } else if (status === 'expiring_soon') {
      message = `Olá ${contract.client.name}! Seu contrato de dedetização vence em ${daysLeft} dias (${new Date(contract.end_date).toLocaleDateString('pt-BR')}). Gostaria de renovar seus serviços?`;
    } else {
      message = `Olá ${contract.client.name}! Entrando em contato sobre seu contrato de dedetização. Como podemos ajudá-lo?`;
    }
    
    const phoneNumber = contract.client.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp aberto com sucesso!');
  };

  const handleRenewalProcess = (contractId: string) => {
    toast.success('Processo de renovação iniciado!');
    toast.info('Um novo contrato será criado automaticamente.');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <AppLayout title="CRM - Renovações">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contratos Vencidos</p>
                <p className="text-2xl font-bold text-red-600">
                  {mockContracts.filter(c => getContractStatus(c.end_date) === 'expired').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vencendo em 30 dias</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {mockContracts.filter(c => getContractStatus(c.end_date) === 'expiring_soon').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contratos Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockContracts.filter(c => getContractStatus(c.end_date) === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por cliente, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className={statusFilter === "all" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Todos ({mockContracts.length})
          </Button>
          <Button
            variant={statusFilter === "expired" ? "default" : "outline"}
            onClick={() => setStatusFilter("expired")}
            className={statusFilter === "expired" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Vencidos
          </Button>
          <Button
            variant={statusFilter === "expiring_soon" ? "default" : "outline"}
            onClick={() => setStatusFilter("expiring_soon")}
            className={statusFilter === "expiring_soon" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Próximos
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            className={statusFilter === "active" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Ativos
          </Button>
        </div>
      </div>

      {/* Lista de Contratos */}
      <div className="grid gap-4">
        {filteredContracts.map((contract) => {
          const status = getContractStatus(contract.end_date);
          const daysLeft = getDaysUntilExpiration(contract.end_date);
          
          return (
            <Card 
              key={contract.id} 
              className={`border-l-4 ${
                status === 'expired' ? 'border-l-red-500 bg-red-50' :
                status === 'expiring_soon' ? 'border-l-yellow-500 bg-yellow-50' :
                'border-l-green-500'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-black">{contract.client.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {contract.client.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {contract.client.phone}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(contract.end_date)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-gray-600">Vencimento:</span>
                      <br />
                      <strong>{new Date(contract.end_date).toLocaleDateString('pt-BR')}</strong>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-gray-600">Dias restantes:</span>
                      <br />
                      <strong className={daysLeft < 0 ? 'text-red-600' : daysLeft <= 30 ? 'text-yellow-600' : 'text-green-600'}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} dias atraso` : `${daysLeft} dias`}
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-gray-600">Valor:</span>
                      <br />
                      <strong>{formatCurrency(contract.value)}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleWhatsAppContact(contract)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WhatsApp
                  </Button>
                  
                  <Button 
                    size="sm" 
                    onClick={() => handleRenewalProcess(contract.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Iniciar Renovação
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                  >
                    Ver Cliente
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredContracts.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Tente ajustar o termo de busca.' : 'Não há contratos para renovação no momento.'}
          </p>
          <Button 
            onClick={() => window.location.href = '/clientes'}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Ver Clientes
          </Button>
        </div>
      )}
    </AppLayout>
  );
}
