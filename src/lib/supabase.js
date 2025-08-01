import { createClient } from '@supabase/supabase-js'
import { FALLBACK_CONFIG, isValidConfig } from '../config/fallback'

// Supabase configuration with fallback
const supabaseUrl = FALLBACK_CONFIG.SUPABASE_URL
const supabaseAnonKey = FALLBACK_CONFIG.SUPABASE_ANON_KEY

// Log configuration status in development
if (FALLBACK_CONFIG.DEBUG_MODE && FALLBACK_CONFIG.ENABLE_CONSOLE_LOGS) {
  console.log('🔗 Supabase Configuration:', {
    url: supabaseUrl,
    hasValidConfig: isValidConfig(),
    environment: FALLBACK_CONFIG.APP_ENVIRONMENT
  })
}

// Create Supabase client with error handling
let supabase
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      debug: FALLBACK_CONFIG.DEBUG_MODE
    },
    global: {
      headers: {
        'X-Client-Info': `${FALLBACK_CONFIG.APP_NAME}@${FALLBACK_CONFIG.APP_VERSION}`
      }
    }
  })
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
