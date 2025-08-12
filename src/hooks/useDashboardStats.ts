import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
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

      async function safeQuery(queryBuilder: any) {
        try {
          const { count, error } = await queryBuilder;
          if (error) {
            console.error('Dashboard stat query failed:', error);
            return 0;
          }
          return count || 0;
        } catch (error) {
          console.error('Dashboard stat query threw an exception:', error);
          return 0;
        }
      };

      const [clientsCount, contractsResult, servicesCount, callsCount, teamsCount] = await Promise.all([
        safeQuery(supabase.from('clients').select('id', { count: 'exact' }).eq('organization_id', organizationId).eq('status', 'em-dia')),
        supabase.from('contracts').select('end_date, value', { count: 'exact' }).eq('organization_id', organizationId).eq('status', 'active'),
        safeQuery(supabase.from('service_calls').select('id', { count: 'exact' }).eq('organization_id', organizationId).eq('status', 'concluido')),
        safeQuery(supabase.from('service_calls').select('id', { count: 'exact' }).eq('organization_id', organizationId).eq('status', 'agendado')),
        safeQuery(supabase.from('teams').select('id', { count: 'exact' }).eq('organization_id', organizationId)),
      ]);

      if (contractsResult.error) throw new Error(`Contratos: ${contractsResult.error.message}`);

      const expiringCount = contractsResult.data?.filter(contract => {
        if (!contract.end_date) return false;
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const endDate = new Date(contract.end_date);
        return endDate <= thirtyDaysFromNow;
      }).length || 0;

      const monthlyRevenue = contractsResult.data?.reduce((sum, contract) => sum + (contract.value || 0), 0) || 0;

      return {
        totalClients: clientsCount,
        activeContracts: contractsResult.count || 0,
        completedServices: servicesCount,
        pendingCalls: callsCount,
        expiringContracts: expiringCount,
        monthlyRevenue: monthlyRevenue,
        pendingRenewals: expiringCount,
        activeTeams: teamsCount,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  });
};
