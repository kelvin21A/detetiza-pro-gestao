// Fallback configuration to prevent white screen in production
// This ensures the app loads even if environment variables are missing

export const FALLBACK_CONFIG = {
  // Supabase fallback (will show error message instead of white screen)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key',
  
  // App configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'DetetizaPro',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.1',
  APP_ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'production',
  
  // Feature flags
  ENABLE_MULTI_TENANT: import.meta.env.VITE_ENABLE_MULTI_TENANT === 'true',
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  ENABLE_CONSOLE_LOGS: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true',
  
  // Default tenant
  DEFAULT_TENANT: import.meta.env.VITE_DEFAULT_TENANT || 'detetizapro',
  
  // WhatsApp
  WHATSAPP_DEFAULT_MESSAGE: import.meta.env.VITE_WHATSAPP_DEFAULT_MESSAGE || 'Olá, gostaria de falar sobre seus serviços de dedetização.'
};

// Check if we're in a valid configuration
export const isValidConfig = () => {
  const hasSupabaseUrl = FALLBACK_CONFIG.SUPABASE_URL !== 'https://placeholder.supabase.co';
  const hasSupabaseKey = FALLBACK_CONFIG.SUPABASE_ANON_KEY !== 'placeholder-key';
  
  return hasSupabaseUrl && hasSupabaseKey;
};

// Log configuration status (only in development)
if (FALLBACK_CONFIG.DEBUG_MODE && FALLBACK_CONFIG.ENABLE_CONSOLE_LOGS) {
  console.log('🔧 DetetizaPro Configuration:', {
    environment: FALLBACK_CONFIG.APP_ENVIRONMENT,
    version: FALLBACK_CONFIG.APP_VERSION,
    hasValidSupabase: isValidConfig(),
    multiTenant: FALLBACK_CONFIG.ENABLE_MULTI_TENANT
  });
}
