import React, { useState, useEffect } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { 
  CheckCircle, 
  Clock, 
  ClipboardList, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  DollarSign
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardMetrics {
  totalClients: number;
  activeContracts: number;
  completedServices: number;
  pendingCalls: number;
  expiringContracts: number;
  monthlyRevenue: number;
  pendingRenewals: number;
  activeTeams: number;
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalClients: 0,
    activeContracts: 0,
    completedServices: 0,
    pendingCalls: 0,
    expiringContracts: 0,
    monthlyRevenue: 0,
    pendingRenewals: 0,
    activeTeams: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.organization_id) {
      loadDashboardMetrics();
    }
  }, [userProfile]);

  const loadDashboardMetrics = async () => {
    try {
      setLoading(true);
      const organizationId = userProfile?.organization_id;
      
      if (!organizationId) {
        toast.error('Erro: Organização não identificada');
        return;
      }

      // Buscar métricas em paralelo para performance SaaS
      const [clientsResult, contractsResult, servicesResult, callsResult, teamsResult] = await Promise.all([
        // Total de clientes ativos
        supabase
          .from('clients')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('active', true),
        
        // Contratos ativos e próximos do vencimento
        supabase
          .from('contracts')
          .select('id, end_date, value', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('status', 'active'),
        
        // Serviços concluídos no mês atual
        supabase
          .from('service_calls')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('status', 'completed')
          .gte('completed_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        // Chamados pendentes
        supabase
          .from('service_calls')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId)
          .in('status', ['scheduled', 'in_progress']),
        
        // Equipes ativas
        supabase
          .from('teams')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('active', true)
      ]);

      // Calcular contratos próximos do vencimento (próximos 30 dias)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringCount = contractsResult.data?.filter(contract => {
        const endDate = new Date(contract.end_date);
        return endDate <= thirtyDaysFromNow;
      }).length || 0;

      // Calcular receita mensal estimada
      const monthlyRevenue = contractsResult.data?.reduce((sum, contract) => {
        return sum + (contract.value || 0);
      }, 0) || 0;

      setMetrics({
        totalClients: clientsResult.count || 0,
        activeContracts: contractsResult.count || 0,
        completedServices: servicesResult.count || 0,
        pendingCalls: callsResult.count || 0,
        expiringContracts: expiringCount,
        monthlyRevenue: monthlyRevenue,
        pendingRenewals: expiringCount, // Renovações pendentes = contratos expirando
        activeTeams: teamsResult.count || 0
      });

    } catch (error) {
      console.error('Erro ao carregar métricas do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <AppLayout title="Dashboard">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Clientes Ativos"
          value={loading ? '...' : metrics.totalClients}
          icon={Users}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardCard
          title="Contratos Ativos"
          value={loading ? '...' : metrics.activeContracts}
          icon={ClipboardList}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardCard
          title="Serviços Concluídos (Mês)"
          value={loading ? '...' : metrics.completedServices}
          icon={CheckCircle}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardCard
          title="Chamados Pendentes"
          value={loading ? '...' : metrics.pendingCalls}
          icon={Clock}
          iconColor="text-red-600"
          loading={loading}
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Contratos Vencendo (30 dias)"
          value={loading ? '...' : metrics.expiringContracts}
          icon={AlertTriangle}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardCard
          title="Receita Mensal Estimada"
          value={loading ? '...' : formatCurrency(metrics.monthlyRevenue)}
          icon={DollarSign}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardCard
          title="Renovações Pendentes"
          value={loading ? '...' : metrics.pendingRenewals}
          icon={TrendingUp}
          iconColor="text-red-600"
          loading={loading}
        />
        <DashboardCard
          title="Equipes Ativas"
          value={loading ? '...' : metrics.activeTeams}
          icon={Calendar}
          iconColor="text-red-600"
          loading={loading}
        />
      </div>
      
      {/* Área Central para Informações Importantes */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-black mb-2">
            📊 Visão Geral da Operação
          </h3>
          <p className="text-gray-600">
            Acompanhe as principais métricas da sua detetizadora em tempo real
          </p>
        </div>

        {/* Alertas e Informações Importantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Alertas de Vencimento */}
          {metrics.expiringContracts > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="font-semibold text-red-800">Atenção Necessária</h4>
              </div>
              <p className="text-red-700 text-sm mb-3">
                {metrics.expiringContracts} contrato{metrics.expiringContracts > 1 ? 's' : ''} vencendo nos próximos 30 dias
              </p>
              <button 
                onClick={() => window.location.href = '/renovacoes'}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
              >
                Ver Renovações
              </button>
            </div>
          )}

          {/* Status Operacional */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <TrendingUp className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="font-semibold text-gray-800">Status Operacional</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa de Conclusão:</span>
                <span className="font-medium text-black">
                  {metrics.completedServices > 0 && metrics.pendingCalls > 0 
                    ? Math.round((metrics.completedServices / (metrics.completedServices + metrics.pendingCalls)) * 100)
                    : 100}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Clientes por Equipe:</span>
                <span className="font-medium text-black">
                  {metrics.activeTeams > 0 ? Math.round(metrics.totalClients / metrics.activeTeams) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-black mb-4">🚀 Ações Rápidas</h4>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => window.location.href = '/clientes/novo'}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              + Novo Cliente
            </button>
            <button 
              onClick={() => window.location.href = '/chamados'}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded transition-colors"
            >
              Ver Chamados
            </button>
            <button 
              onClick={() => window.location.href = '/renovacoes'}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded transition-colors"
            >
              Gerenciar Renovações
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}