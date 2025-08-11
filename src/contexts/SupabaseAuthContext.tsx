import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { FALLBACK_CONFIG } from '../config/fallback';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'technician';
  tenant_id: string | null;
  active: boolean;
  is_super_admin: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  settings: Record<string, any>;
  active: boolean;
}

interface SupabaseAuthContextType {
  user: User | null;
  profile: UserProfile | null;
  tenant: TenantInfo | null;
  session: Session | null;
  loading: boolean;
  isProduction: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  changePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  createTenant: (tenantData: Partial<TenantInfo>) => Promise<{ error: Error | null; tenant?: TenantInfo }>;
  createUser: (userData: Partial<UserProfile> & { password: string }) => Promise<{ error: Error | null; user?: UserProfile }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isProduction = FALLBACK_CONFIG.APP_ENVIRONMENT === 'production';

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { profile: null, tenant: null };
      }

      const profile = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        tenant_id: data.tenant_id,
        active: data.active,
        is_super_admin: data.is_super_admin,
        must_change_password: data.must_change_password,
        created_at: data.created_at,
        updated_at: data.updated_at
      } as UserProfile;

      const tenant = data.tenant ? {
        id: data.tenant.id,
        name: data.tenant.name,
        subdomain: data.tenant.subdomain,
        settings: data.tenant.settings,
        active: data.tenant.active
      } as TenantInfo : null;

      return { profile, tenant };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return { profile: null, tenant: null };
    }
  };

  // Set up auth state listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then(({ profile, tenant }) => {
          setProfile(profile);
          setTenant(tenant);
          
          // Check if user must change password
          if (profile?.must_change_password) {
            toast({
              title: 'Aviso',
              description: 'Você deve alterar sua senha no primeiro acesso',
              duration: 5000
            });
          }
          
          // Check if user is active
          if (profile && !profile.active) {
            toast({
              title: 'Erro',
              description: 'Sua conta está inativa. Contate o administrador.',
              variant: 'destructive'
            });
            signOut();
            return;
          }
          
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { profile, tenant } = await fetchUserProfile(session.user.id);
        setProfile(profile);
        setTenant(tenant);
        
        if (event === 'SIGNED_IN' && profile?.must_change_password) {
          toast({
            title: 'Aviso',
            description: 'Você deve alterar sua senha no primeiro acesso',
            duration: 5000
          });
        }
      } else {
        setProfile(null);
        setTenant(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        let errorMessage = 'Erro ao fazer login';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
        }
        
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Sucesso',
          description: 'Login realizado com sucesso!'
        });
      }
      
      return { error };
    } catch (error) {
      const authError = error as AuthError;
      toast.error('Erro inesperado: ' + authError.message);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name
          }
        }
      });
      
      if (authError) {
        toast.error('Erro ao criar conta: ' + authError.message);
        return { error: authError };
      }
      
      // Then create the user profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: userData.full_name || '',
            role: userData.role || 'technician',
            tenant_id: userData.tenant_id,
            active: true,
            is_super_admin: userData.is_super_admin || false,
            must_change_password: userData.must_change_password || false
          });
          
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't show error to user as auth user was created successfully
        }
      }
      
      toast.success('Conta criada com sucesso!');
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      toast.error('Erro inesperado: ' + authError.message);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('Erro ao fazer logout: ' + error.message);
      } else {
        toast.success('Logout realizado com sucesso!');
        setProfile(null);
        setTenant(null);
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro inesperado ao fazer logout');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: new Error('Usuário não autenticado') };
      }

      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        toast.error(`Erro ao atualizar perfil: ${error.message}`);
        return { error: new Error(error.message) };
      }

      // Refresh user profile
      const { profile: updatedProfile } = await fetchUserProfile(user.id);
      setProfile(updatedProfile);
      
      toast.success('Perfil atualizado com sucesso!');
      return { error: null };
    } catch (error) {
      toast.error('Erro inesperado ao atualizar perfil');
      return { error: error as Error };
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: 'Erro',
          description: `Erro ao alterar senha: ${error.message}`,
          variant: 'destructive'
        });
        return { error };
      }

      // Update must_change_password flag
      if (profile?.must_change_password) {
        await updateProfile({ must_change_password: false });
      }

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso!'
      });
      return { error: null };
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao alterar senha',
        variant: 'destructive'
      });
      return { error: error as AuthError };
    }
  };

  const createTenant = async (tenantData: Partial<TenantInfo>) => {
    try {
      if (!profile?.is_super_admin) {
        return { error: new Error('Apenas super administradores podem criar tenants') };
      }

      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: tenantData.name,
          subdomain: tenantData.subdomain,
          settings: tenantData.settings || {},
          active: true
        })
        .select()
        .single();

      if (error) {
        toast.error(`Erro ao criar empresa: ${error.message}`);
        return { error: new Error(error.message) };
      }

      toast.success('Empresa criada com sucesso!');
      return { error: null, tenant: data as TenantInfo };
    } catch (error) {
      toast.error('Erro inesperado ao criar empresa');
      return { error: error as Error };
    }
  };

  const createUser = async (userData: Partial<UserProfile> & { password: string }) => {
    try {
      if (!profile?.is_super_admin && profile?.role !== 'admin') {
        return { error: new Error('Apenas administradores podem criar usuários') };
      }

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email!,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        toast.error(`Erro ao criar usuário: ${authError.message}`);
        return { error: new Error(authError.message) };
      }

      // Create user profile
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name || '',
          role: userData.role || 'technician',
          tenant_id: userData.tenant_id || profile.tenant_id,
          active: true,
          is_super_admin: false,
          must_change_password: true
        })
        .select()
        .single();

      if (error) {
        toast.error(`Erro ao criar perfil: ${error.message}`);
        return { error: new Error(error.message) };
      }

      toast.success('Usuário criado com sucesso!');
      return { error: null, user: data as UserProfile };
    } catch (error) {
      toast.error('Erro inesperado ao criar usuário');
      return { error: error as Error };
    }
  };

  const value: SupabaseAuthContextType = {
    user,
    profile,
    tenant,
    session,
    loading,
    isProduction,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
    createTenant,
    createUser,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
