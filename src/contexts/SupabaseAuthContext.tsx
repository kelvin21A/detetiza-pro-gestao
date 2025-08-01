import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'technician';
  tenant_id: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user?: User; error?: AuthError | null }>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<{ user?: User; error?: AuthError | null }>;
  signOut: () => Promise<{ error?: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: any }>;
  changePassword: (newPassword: string) => Promise<{ error?: AuthError | null }>;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  getTenantId: () => string | null;
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile when user signs in
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
          
          // Check if user must change password
          if (profile?.must_change_password) {
            toast.warning('Você deve alterar sua senha no primeiro acesso');
          }
        } else {
          setUserProfile(null);
        }

        setLoading(false);
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`Erro ao fazer login: ${error.message}`);
        return { error };
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        
        if (!profile?.is_active) {
          await supabase.auth.signOut();
          toast.error('Usuário inativo. Entre em contato com o administrador.');
          return { error: new Error('Usuário inativo') as AuthError };
        }

        toast.success('Login realizado com sucesso!');
        return { user: data.user };
      }

      return { error };
    } catch (error) {
      toast.error('Erro inesperado ao fazer login');
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);

      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name || '',
          }
        }
      });

      if (authError) {
        toast.error(`Erro ao criar usuário: ${authError.message}`);
        return { error: authError };
      }

      if (authData.user) {
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: authData.user.email,
            full_name: userData.full_name || '',
            role: userData.role || 'technician',
            tenant_id: userData.tenant_id,
            is_active: true,
            must_change_password: userData.must_change_password || false,
          }]);

        if (profileError) {
          toast.error(`Erro ao criar perfil: ${profileError.message}`);
          // Clean up auth user if profile creation fails
          await supabase.auth.admin.deleteUser(authData.user.id);
          return { error: profileError as AuthError };
        }

        toast.success('Usuário criado com sucesso!');
        return { user: authData.user };
      }

      return { error: authError };
    } catch (error) {
      toast.error('Erro inesperado ao criar usuário');
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(`Erro ao fazer logout: ${error.message}`);
        return { error };
      }

      setUser(null);
      setUserProfile(null);
      setSession(null);
      toast.success('Logout realizado com sucesso!');
      
      return {};
    } catch (error) {
      toast.error('Erro inesperado ao fazer logout');
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: 'Usuário não autenticado' };
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
        return { error };
      }

      // Refresh user profile
      const updatedProfile = await fetchUserProfile(user.id);
      setUserProfile(updatedProfile);
      
      toast.success('Perfil atualizado com sucesso!');
      return {};
    } catch (error) {
      toast.error('Erro inesperado ao atualizar perfil');
      return { error };
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(`Erro ao alterar senha: ${error.message}`);
        return { error };
      }

      // Update must_change_password flag
      if (userProfile?.must_change_password) {
        await updateProfile({ must_change_password: false });
      }

      toast.success('Senha alterada com sucesso!');
      return {};
    } catch (error) {
      toast.error('Erro inesperado ao alterar senha');
      return { error: error as AuthError };
    }
  };

  const isSuperAdmin = () => {
    return userProfile?.role === 'super_admin';
  };

  const isAdmin = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  };

  const getTenantId = () => {
    return userProfile?.tenant_id || null;
  };

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
    isSuperAdmin,
    isAdmin,
    getTenantId,
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
