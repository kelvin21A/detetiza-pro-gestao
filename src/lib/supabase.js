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
let supabase
try {
  // Só tenta criar o cliente se as variáveis existirem
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } else {
    // Lança um erro se as chaves não estiverem presentes
    throw new Error('Credenciais do Supabase não encontradas.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error)
  // Create a mock client to prevent app crashes
  supabase = {
    auth: {
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }) }) }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }) })
    })
  }
}

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
