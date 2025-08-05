import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: metrics, isLoading, isError, error } = useDashboardStats();

  const loading = isLoading || !metrics;
  const currentMetrics = metrics || {
    totalClients: 0,
    activeContracts: 0,
    completedServices: 0,
    pendingCalls: 0,
    expiringContracts: 0,
    monthlyRevenue: 0,
    pendingRenewals: 0,
    activeTeams: 0,
  };

  if (isError) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-12 bg-red-50 p-6 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar o Dashboard</h3>
          <p className="text-red-700">{(error as Error)?.message || 'Não foi possível buscar os dados. Tente novamente mais tarde.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Clientes Ativos"
          value={currentMetrics.totalClients}
          icon={Users}
          loading={loading}
        />
        <DashboardCard
          title="Serviços Concluídos (Mês)"
          value={currentMetrics.completedServices}
          icon={CheckCircle}
          loading={loading}
        />
        <DashboardCard
          title="Chamados Pendentes"
          value={currentMetrics.pendingCalls}
          icon={Clock}
          loading={loading}
        />
        <DashboardCard
          title="Renovações Pendentes"
          value={currentMetrics.pendingRenewals}
          icon={TrendingUp}
          loading={loading}
        />
        <DashboardCard
          title="Receita Mensal"
          value={formatCurrency(currentMetrics.monthlyRevenue)}
          icon={DollarSign}
          loading={loading}
        />
        <DashboardCard
          title="Equipes Ativas"
          value={currentMetrics.activeTeams}
          icon={Calendar}
          loading={loading}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visão Geral da Operação</CardTitle>
            <CardDescription>Acompanhe as principais métricas da sua empresa.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!loading && currentMetrics.expiringContracts > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <h4 className="font-semibold text-red-800">Atenção Necessária</h4>
                </div>
                <p className="text-red-700 text-sm mb-3">
                  {currentMetrics.expiringContracts} contrato{currentMetrics.expiringContracts > 1 ? 's' : ''} vencendo nos próximos 30 dias.
                </p>
                <Button onClick={() => navigate('/renovacoes')} size="sm">
                  Ver Renovações
                </Button>
              </div>
            )}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-5 h-5 text-gray-600 mr-2" />
                <h4 className="font-semibold text-gray-800">Status Operacional</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Conclusão:</span>
                  <span className="font-medium text-black">
                    {(currentMetrics.completedServices > 0 || currentMetrics.pendingCalls > 0)
                      ? `${Math.round((currentMetrics.completedServices / (currentMetrics.completedServices + currentMetrics.pendingCalls)) * 100)}%`
                      : '100%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clientes por Equipe:</span>
                  <span className="font-medium text-black">
                    {currentMetrics.activeTeams > 0 ? Math.round(currentMetrics.totalClients / currentMetrics.activeTeams) : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🚀 Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => navigate('/clientes/novo')}>
              + Novo Cliente
            </Button>
            <Button onClick={() => navigate('/chamados')} variant="secondary">
              Ver Chamados
            </Button>
            <Button onClick={() => navigate('/renovacoes')} variant="secondary">
              Gerenciar Renovações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}