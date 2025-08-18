import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Leitura das variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validação das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
  console.warn('⚠️ Aviso: Credenciais do Supabase não configuradas. Usando modo de desenvolvimento.');
  console.warn('📝 Para configurar: Edite o arquivo .env com suas credenciais reais do Supabase.');
}

// Log para depuração em ambiente de desenvolvimento
if (import.meta.env.DEV) {
  console.log('🔗 Configuração do Supabase:', {
    url: supabaseUrl ? 'URL definida' : 'URL não definida',
    key: supabaseAnonKey ? 'Chave definida' : 'Chave não definida',
    configured: supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project') && !supabaseAnonKey.includes('your-anon-key')
  });
}

// Criar cliente Supabase (mesmo com credenciais de desenvolvimento)
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Database table names
export const TABLES = {
  USERS: 'users',
  CLIENTS: 'clients',
  CONTRACTS: 'contracts',
  SERVICES: 'services',
  SERVICE_CALLS: 'service_calls',
  TEAMS: 'teams',
  TEAM_MEMBERS: 'team_members',
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  RENEWALS: 'renewals'
}
