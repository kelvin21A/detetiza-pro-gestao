import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para verificar e gerenciar contratos de clientes
 */
export const useClientContracts = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  /**
   * Verifica se um cliente tem contratos ativos
   * @param clientId ID do cliente
   * @returns Objeto com o resultado da verificação
   */
  const checkActiveContract = async (clientId: string) => {
    if (!clientId || !organizationId) {
      return { hasActiveContract: false, message: 'Cliente ou organização não identificados' };
    }

    try {
      // Assumindo que existe uma tabela 'contracts' com os campos necessários
      // Esta consulta deve ser adaptada à estrutura real do banco de dados
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id, status, start_date, end_date')
        .eq('client_id', clientId)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('end_date', { ascending: false });

      if (error) {
        console.error('Erro ao verificar contratos:', error);
        return { 
          hasActiveContract: false, 
          message: 'Erro ao verificar contratos do cliente.',
          error
        };
      }

      // Verificar se há pelo menos um contrato ativo
      const hasActiveContract = contracts && contracts.length > 0;
      
      return { 
        hasActiveContract, 
        contracts,
        message: hasActiveContract ? 
          `Cliente possui ${contracts.length} contrato(s) ativo(s)` : 
          'Cliente não possui contratos ativos'
      };
    } catch (error) {
      console.error('Erro ao verificar contratos:', error);
      return { 
        hasActiveContract: false, 
        message: 'Não foi possível verificar os contratos do cliente.',
        error
      };
    }
  };

  /**
   * Busca todos os contratos de um cliente
   */
  const getClientContracts = async (clientId: string) => {
    if (!clientId || !organizationId) {
      return { contracts: [], error: 'Cliente ou organização não identificados' };
    }

    try {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { contracts, error: null };
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      return { contracts: [], error };
    }
  };

  return { checkActiveContract, getClientContracts };
};