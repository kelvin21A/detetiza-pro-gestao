import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Search, FileDown, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useContracts, Contract } from '@/hooks/useContracts'; 
import { Loader2 } from 'lucide-react';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'; 

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
          Ativo
        </Badge>
      );
  }
};

export default function Renovacoes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Contract; direction: 'ascending' | 'descending' } | null>(null);

  const { contracts, isLoading, isError } = useContracts();

  const sortedRenovacoes = useMemo(() => {
    if (!contracts) return [];

    let renovacoesData: Contract[] = [...contracts];

    if (searchTerm) {
      renovacoesData = renovacoesData.filter(item =>
        item.clients?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig !== null) {
      renovacoesData.sort((a, b) => {
        const key = sortConfig.key;
        let aValue: any;
        let bValue: any;

        if (key === 'clients') {
          aValue = a.clients?.name || '';
          bValue = b.clients?.name || '';
        } else if (key === 'end_date') {
          aValue = new Date(a.end_date).getTime();
          bValue = new Date(b.end_date).getTime();
        } else {
          aValue = a[key];
          bValue = b[key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return renovacoesData;
  }, [contracts, searchTerm, sortConfig]);

  const requestSort = (key: keyof Contract) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleWhatsAppClick = (contract: Contract) => {
    if (!contract.clients || !contract.clients.phone) return;
    const daysLeft = getDaysUntilExpiration(contract.end_date);
    const status = getContractStatus(contract.end_date);
    
    let message = '';
    if (status === 'expired') {
      message = `Olá ${contract.clients.name}! Seu contrato conosco venceu há ${Math.abs(daysLeft)} dias. Gostaria de renovar para continuar protegido?`;
    } else {
      message = `Olá ${contract.clients.name}, tudo bem? Seu contrato está prestes a vencer em ${daysLeft} dias. Vamos conversar sobre a renovação?`;
    }

    const phone = contract.clients.phone.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar renovações</h3>
          <p className="text-red-700">Não foi possível buscar os dados. Tente novamente mais tarde.</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => requestSort('clients')}>
              <div className="flex items-center cursor-pointer">
                Cliente {sortConfig?.key === 'clients' && (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead onClick={() => requestSort('service_type')}>
              <div className="flex items-center cursor-pointer">
                Plano {sortConfig?.key === 'service_type' && (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead onClick={() => requestSort('value')}>
              <div className="flex items-center cursor-pointer">
                Valor {sortConfig?.key === 'value' && (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead onClick={() => requestSort('end_date')}>
              <div className="flex items-center cursor-pointer">
                Data de Vencimento {sortConfig?.key === 'end_date' && (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRenovacoes.map((renovacao) => (
            <TableRow key={renovacao.id}>
              <TableCell>{renovacao.clients?.name || 'Cliente não encontrado'}</TableCell>
              <TableCell>{renovacao.service_type || 'N/A'}</TableCell>
              <TableCell>R$ {renovacao.value?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>{new Date(renovacao.end_date).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell>
                {getStatusBadge(renovacao.end_date)}
              </TableCell>
              <TableCell>
                <WhatsAppButton
                  onClick={() => handleWhatsAppClick(renovacao)}
                  disabled={!renovacao.clients?.phone}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Controle de Renovações</h1>
      <Card>
        <CardHeader>
          <CardTitle>Renovações Pendentes</CardTitle>
          <div className="flex justify-between items-center mt-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}