import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rhztqshwbyfcfnvhjjzc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoenRxc2h3YnlmY2ZudmhqanpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTExMTEsImV4cCI6MjA2OTU4NzExMX0.dotdnJ46T6oye-rNOQW1ODNYTfQoZEpq7DAnQn2o7rQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
