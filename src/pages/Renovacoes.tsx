import React, { useState, useMemo } from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Search, FileDown, Phone } from 'lucide-react';
import { useContracts } from '@/hooks/useContracts';
import { Loader2, AlertTriangle } from 'lucide-react';

interface Renovacao {
  id: string;
  cliente: string;
  plano: string;
  valor: number;
  dataVencimento: string;
  status: 'Vence Hoje' | 'Vence em 5 dias' | 'Vence em 15 dias' | 'Vencido';
}

const getStatusVariant = (status: Renovacao['status']) => {
  switch (status) {
    case 'Vence Hoje':
      return 'destructive';
    case 'Vence em 5 dias':
      return 'secondary';
    case 'Vence em 15 dias':
      return 'outline';
    case 'Vencido':
      return 'default';
    default:
      return 'default';
  }
};

export default function Renovacoes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Renovacao; direction: 'ascending' | 'descending' } | null>(null);

  const { contracts, isLoading, isError } = useContracts();

  const sortedRenovacoes = useMemo(() => {
    if (!contracts) return [];

    let renovacoesData: Renovacao[] = contracts.map(contract => ({
      id: contract.id,
      cliente: contract.client_id,
      plano: contract.details || 'N/A',
      valor: contract.price || 0,
      dataVencimento: new Date(contract.end_date).toLocaleDateString('pt-BR'),
      status: 'Vence em 15 dias',
    }));

    if (searchTerm) {
      renovacoesData = renovacoesData.filter(item =>
        item.cliente.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig !== null) {
      renovacoesData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return renovacoesData;
  }, [contracts, searchTerm, sortConfig]);

  const requestSort = (key: keyof Renovacao) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleWhatsAppClick = (clienteNome: string) => {
    console.log(`Iniciar conversa com ${clienteNome}`);
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
            <TableHead onClick={() => requestSort('cliente')}>
              <div className="flex items-center cursor-pointer">
                Cliente {sortConfig?.key === 'cliente' && (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead onClick={() => requestSort('plano')}>
              <div className="flex items-center cursor-pointer">
                Plano {sortConfig?.key === 'plano' && (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead onClick={() => requestSort('valor')}>
              <div className="flex items-center cursor-pointer">
                Valor {sortConfig?.key === 'valor' && (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead onClick={() => requestSort('dataVencimento')}>
              <div className="flex items-center cursor-pointer">
                Data de Vencimento {sortConfig?.key === 'dataVencimento' && (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRenovacoes.map((renovacao) => (
            <TableRow key={renovacao.id}>
              <TableCell>{renovacao.cliente}</TableCell>
              <TableCell>{renovacao.plano}</TableCell>
              <TableCell>R$ {renovacao.valor.toFixed(2)}</TableCell>
              <TableCell>{renovacao.dataVencimento}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(renovacao.status)}>{renovacao.status}</Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => handleWhatsAppClick(renovacao.cliente)}>
                  <Phone className="h-4 w-4 text-green-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <AppLayout>
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
    </AppLayout>
  );
}