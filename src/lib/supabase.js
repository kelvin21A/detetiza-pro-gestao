import { createClient } from '@supabase/supabase-js'
// Leitura das variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro de Configuração: As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram definidas no arquivo .env');
}

// Log para depuração em ambiente de desenvolvimento
if (import.meta.env.DEV) {
  console.log('🔗 Configuração do Supabase:', {
    url: supabaseUrl ? 'URL definida' : 'URL não definida',
    key: supabaseAnonKey ? 'Chave definida' : 'Chave não definida',
  });
}

// Create Supabase client with error handling
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Credenciais do Supabase não encontradas. Verifique seu arquivo .env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export { supabase }

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
