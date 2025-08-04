import React, { useState, useEffect } from 'react';
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
  MapPin,
  DollarSign,
  Loader2
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Contract {
  id: string;
  client_id: string;
  start_date: string;
  end_date: string;
  value: number;
  status: string;
  service_type: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

export default function Renovacoes() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRenewal, setProcessingRenewal] = useState<string | null>(null);
  const { user } = useAuth();

  const loadContracts = async () => {
    if (!user?.organization_id) return;
    
    try {
      setLoading(true);
      
      // Buscar contratos com dados do cliente
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          client_id,
          start_date,
          end_date,
          value,
          status,
          service_type,
          clients!inner (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .eq('organization_id', user.organization_id)
        .eq('status', 'active')
        .order('end_date', { ascending: true });

      if (error) {
        console.error('Erro ao carregar contratos:', error);
        toast.error('Erro ao carregar contratos');
        return;
      }

      setContracts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [user]);

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

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.clients?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.clients?.phone.includes(searchTerm);
    
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

  const handleWhatsAppContact = (contract: Contract) => {
    const daysLeft = getDaysUntilExpiration(contract.end_date);
    const status = getContractStatus(contract.end_date);
    
    let message = '';
    if (status === 'expired') {
      message = `Olá ${contract.clients?.name}! Seu contrato de dedetização venceu há ${Math.abs(daysLeft)} dias. Gostaria de renovar seus serviços? Entre em contato conosco para não ficar desprotegido!`;
    } else if (status === 'expiring_soon') {
      message = `Olá ${contract.clients?.name}! Seu contrato de dedetização vence em ${daysLeft} dias (${new Date(contract.end_date).toLocaleDateString('pt-BR')}). Gostaria de renovar seus serviços?`;
    } else {
      message = `Olá ${contract.clients?.name}! Entrando em contato sobre seu contrato de dedetização. Como podemos ajudá-lo?`;
    }
    
    const phoneNumber = contract.clients?.phone?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRenewalProcess = async (contractId: string) => {
    try {
      setProcessingRenewal(contractId);
      
      // Aqui você implementaria a lógica de renovação
      // Por exemplo: criar novo contrato, atualizar status, etc.
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular processamento
      
      toast.success('Processo de renovação iniciado com sucesso!');
      toast.info('Um novo contrato será criado automaticamente.');
      
      // Recarregar dados
      await loadContracts();
      
    } catch (error) {
      console.error('Erro ao processar renovação:', error);
      toast.error('Erro ao processar renovação');
    } finally {
      setProcessingRenewal(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <AppLayout title="Renovações">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <span className="ml-2 text-gray-600">Carregando renovações...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="CRM - Renovações">
      <div className="space-y-6">
        {/* Header com Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Contratos Vencidos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {contracts.filter(c => getContractStatus(c.end_date) === 'expired').length}
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
                    {contracts.filter(c => getContractStatus(c.end_date) === 'expiring_soon').length}
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
                    {contracts.filter(c => getContractStatus(c.end_date) === 'active').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4">
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
              Todos ({contracts.length})
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
                      <CardTitle className="text-lg text-black">{contract.clients?.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {contract.clients?.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {contract.clients?.phone}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(contract.end_date)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <span className="text-gray-600">Vencimento:</span>
                        <br />
                        <strong>{new Date(contract.end_date).toLocaleDateString('pt-BR')}</strong>
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
                    
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <span className="text-gray-600">Endereço:</span>
                        <br />
                        <strong>{contract.clients?.address}</strong>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        className="bg-green-600 text-white hover:bg-green-700"
                        size="sm"
                        onClick={() => handleWhatsAppContact(contract)}
                        title="Enviar mensagem WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                      
                      <Button 
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        size="sm"
                        onClick={() => handleRenewalProcess(contract.id)}
                        disabled={processingRenewal === contract.id}
                        title="Iniciar processo de renovação"
                      >
                        {processingRenewal === contract.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Renovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma renovação encontrada para o filtro selecionado.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}