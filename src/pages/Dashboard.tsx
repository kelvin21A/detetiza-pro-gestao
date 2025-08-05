import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  CheckCircle,
  Clock,
  ClipboardList,
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Clientes Ativos"
          value={loading ? '...' : currentMetrics.totalClients}
          icon={Users}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardCard
          title="Serviços Concluídos (Mês)"
          value={loading ? '...' : currentMetrics.completedServices}
          icon={CheckCircle}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardCard
          title="Chamados Pendentes"
          value={loading ? '...' : currentMetrics.pendingCalls}
          icon={Clock}
          iconColor="text-red-600"
          loading={loading}
        />
         <DashboardCard
          title="Renovações Pendentes"
          value={loading ? '...' : currentMetrics.pendingRenewals}
          icon={TrendingUp}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardCard
          title="Receita Mensal Estimada"
          value={loading ? '...' : formatCurrency(currentMetrics.monthlyRevenue)}
          icon={DollarSign}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardCard
          title="Equipes Ativas"
          value={loading ? '...' : currentMetrics.activeTeams}
          icon={Calendar}
          iconColor="text-red-600"
          loading={loading}
        />
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-black mb-2">
            📊 Visão Geral da Operação
          </h3>
          <p className="text-gray-600">
            Acompanhe as principais métricas da sua detetizadora em tempo real
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!loading && currentMetrics.expiringContracts > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="font-semibold text-red-800">Atenção Necessária</h4>
              </div>
              <p className="text-red-700 text-sm mb-3">
                {currentMetrics.expiringContracts} contrato{currentMetrics.expiringContracts > 1 ? 's' : ''} vencendo nos próximos 30 dias
              </p>
              <button 
                onClick={() => navigate('/renovacoes')}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
              >
                Ver Renovações
              </button>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
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
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-black mb-4">🚀 Ações Rápidas</h4>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/clientes/novo')}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              + Novo Cliente
            </button>
            <button 
              onClick={() => navigate('/chamados')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded transition-colors"
            >
              Ver Chamados
            </button>
            <button 
              onClick={() => navigate('/renovacoes')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded transition-colors"
            >
              Gerenciar Renovações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}