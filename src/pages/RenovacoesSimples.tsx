import { useState, useMemo } from 'react';
import AppLayout from "@/components/layout/AppLayout";
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
  DollarSign,
  Loader2
} from "lucide-react";
import { useContracts, Contract } from '@/hooks/useContracts';
import { toast } from 'sonner';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';

export default function RenovacoesSimples() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { contracts, isLoading, isError, updateContract } = useContracts();

  const getDaysUntilExpiration = (endDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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

  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    return contracts.filter(contract => {
      const client = contract.clients;
      const matchesSearch = client ? 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.phone && client.phone.includes(searchTerm))
        : false;
      
      if (statusFilter === "all") return matchesSearch;
      
      const contractStatus = getContractStatus(contract.end_date);
      return statusFilter === contractStatus && matchesSearch;
    });
  }, [contracts, searchTerm, statusFilter]);

  const getStatusBadge = (endDate: string) => {
    const status = getContractStatus(endDate);
    const daysLeft = getDaysUntilExpiration(endDate);
    
    switch (status) {
      case "expired":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Vencido ({Math.abs(daysLeft)} dias)
          </Badge>
        );
      case "expiring_soon":
        return (
          <Badge className="bg-yellow-400 text-black hover:bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            Vence em {daysLeft} dias
          </Badge>
        );
      default:
        return (
          <Badge variant="default">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo ({daysLeft} dias)
          </Badge>
        );
    }
  };

  const handleWhatsAppContact = (contract: Contract) => {
    if (!contract.clients) return;
    const daysLeft = getDaysUntilExpiration(contract.end_date);
    const status = getContractStatus(contract.end_date);
    
    let message = '';
    if (status === 'expired') {
      message = `Olá ${contract.clients.name}! Seu contrato conosco venceu há ${Math.abs(daysLeft)} dias. Gostaria de renovar para continuar protegido?`;
    } else {
      message = `Olá ${contract.clients.name}, tudo bem? Seu contrato está prestes a vencer em ${daysLeft} dias. Vamos conversar sobre a renovação?`;
    }

    const phone = contract.clients.phone?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRenewalProcess = async (contractId: string) => {
    const newEndDate = new Date();
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    
    await updateContract({
      id: contractId,
      updates: { end_date: newEndDate.toISOString().split('T')[0] }
    });
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-12 bg-red-50 p-6 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar contratos</h3>
          <p className="text-red-700">Não foi possível buscar os dados. Tente novamente mais tarde.</p>
        </div>
      );
    }

    if (filteredContracts.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum contrato encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' ? 'Tente ajustar sua busca ou filtros.' : 'Nenhum contrato cadastrado ainda.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredContracts.map(contract => {
          const daysLeft = getDaysUntilExpiration(contract.end_date);
          return (
            <Card key={contract.id} className="shadow-sm hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-black">{contract.clients?.name || 'Cliente não encontrado'}</CardTitle>
                    <div className="flex flex-col gap-1 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {contract.clients?.email || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {contract.clients?.phone || 'N/A'}
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
                  <WhatsAppButton
                    onClick={() => handleWhatsAppContact(contract)}
                    disabled={!contract.clients?.phone}
                    text="WhatsApp"
                    className="h-9"
                  />
                  
                  <Button 
                    size="sm" 
                    onClick={() => handleRenewalProcess(contract.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Renovar por 1 Ano
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout title="Renovações">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Contratos a Vencer</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Buscar cliente..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading || isError}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>Todos</Button>
          <Button variant={statusFilter === 'expiring_soon' ? 'default' : 'outline'} onClick={() => setStatusFilter('expiring_soon')}>Vencendo em 30 dias</Button>
          <Button variant={statusFilter === 'expired' ? 'default' : 'outline'} onClick={() => setStatusFilter('expired')}>Vencidos</Button>
          <Button variant={statusFilter === 'active' ? 'default' : 'outline'} onClick={() => setStatusFilter('active')}>Ativos</Button>
        </div>

        {renderContent()}
      </div>
    </AppLayout>
  );
}
