import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';



export const useDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: async () => {
      if (!user?.user_metadata.organization_id) {
        throw new Error('Organização não encontrada para este usuário.');
      }
      const organizationId = user.user_metadata.organization_id;

      const [clientsResult, contractsResult, servicesResult, callsResult, teamsResult] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact' }).eq('organization_id', organizationId).eq('status', 'em-dia'),
        supabase.from('contracts').select('end_date, value', { count: 'exact' }).eq('organization_id', organizationId).eq('status', 'active'),
        supabase.from('service_calls').select('id', { count: 'exact' }).eq('organization_id', organizationId).eq('status', 'completed').gte('completed_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('service_calls').select('id', { count: 'exact' }).eq('organization_id', organizationId).eq('status', 'pending'),
        supabase.from('teams').select('id', { count: 'exact' }).eq('organization_id', organizationId)
      ]);

      if (clientsResult.error) throw new Error(`Clientes: ${clientsResult.error.message}`);
      if (contractsResult.error) throw new Error(`Contratos: ${contractsResult.error.message}`);
      if (servicesResult.error) throw new Error(`Serviços: ${servicesResult.error.message}`);
      if (callsResult.error) throw new Error(`Chamados: ${callsResult.error.message}`);
      if (teamsResult.error) throw new Error(`Equipes: ${teamsResult.error.message}`);

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringCount = contractsResult.data?.filter(contract => {
        const endDate = new Date(contract.end_date);
        return endDate <= thirtyDaysFromNow;
      }).length || 0;

      const monthlyRevenue = contractsResult.data?.reduce((sum, contract) => sum + (contract.value || 0), 0) || 0;

      return {
        totalClients: clientsResult.count || 0,
        activeContracts: contractsResult.count || 0,
        completedServices: servicesResult.count || 0,
        pendingCalls: callsResult.count || 0,
        expiringContracts: expiringCount,
        monthlyRevenue: monthlyRevenue,
        pendingRenewals: expiringCount,
        activeTeams: teamsResult.count || 0,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  });
};
