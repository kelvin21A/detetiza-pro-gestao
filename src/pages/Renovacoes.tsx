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
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
          client:clients!inner (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .eq('organization_id', organizationId)
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

  const handleWhatsAppContact = (contract: Contract) => {
    const daysLeft = getDaysUntilExpiration(contract.end_date);
    const status = getContractStatus(contract.end_date);
    
    let message = '';
    if (status === 'expired') {
      message = `Olá ${contract.client.name}! Seu contrato de dedetização venceu há ${Math.abs(daysLeft)} dias. Gostaria de renovar seus serviços? Entre em contato conosco para não ficar desprotegido!`;
    } else if (status === 'expiring_soon') {
    }
    if (!isValidPhone(contract.clients.phone)) {
      toast({ title: 'Atenção', description: 'O número de WhatsApp do cliente não é válido.', variant: 'destructive' });
      return;
    }
    sendWhatsAppMessage(contract.clients.phone, `Olá, ${contract.clients.name}! Seu contrato está próximo do vencimento.`);
    toast({ title: 'Sucesso', description: 'Mensagem enviada para o WhatsApp.' });
  };

  const handleRenew = async (contractId: string) => {
    setProcessingId(contractId);
    await renewContract(contractId, {
      onSuccess: () => {
        toast({ title: 'Sucesso', description: 'Contrato renovado com sucesso!' });
      },
      onError: (err) => {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      },
      onSettled: () => {
        setProcessingId(null);
      }
    });
  };

  const statusFilters = ['todos', 'active', 'expired', 'renewed'];

  return (
    <AppLayout title="Gestão de Renovações">
      <div className="p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Contratos e Renovações</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou e-mail..."
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
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-2">Carregando contratos...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-red-500 bg-red-50 p-4 rounded-md">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-semibold">Erro ao carregar os contratos.</p>
                <p className="text-sm text-red-400">{(error as Error)?.message || 'Tente recarregar a página.'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.length > 0 ? (
                    filteredContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <div className="font-medium">{contract.clients.name}</div>
                          <div className="text-sm text-muted-foreground">{contract.clients.email || 'N/A'}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(contract.status)}</TableCell>
                        <TableCell>{new Date(contract.end_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)}</TableCell>
                        <TableCell className="text-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleWhatsAppClick(contract)}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Contatar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRenew(contract.id)}
                            disabled={processingId === contract.id || contract.status !== 'active'}
                          >
                            {processingId === contract.id ?
                              <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
                              <CalendarCheck className="w-4 h-4 mr-2" />
                            }
                            Renovar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        Nenhum contrato encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{filteredContracts.length} de {contracts?.length || 0}</strong> contratos.
            </div>
          </CardFooter>
        </Card>
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