import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'technician';
  organization_id: string | null;
  is_super_admin?: boolean;
  active: boolean;
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
  testLogin: () => Promise<{ error: any }>;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  getTenantId: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing test session first
    const testUser = localStorage.getItem('testUser');
    if (testUser) {
      try {
        const userData = JSON.parse(testUser);
        setUser(userData);
        setUserProfile({
          id: userData.id,
          email: userData.email,
          full_name: userData.name || 'Administrador',
          role: userData.role || 'admin',
          organization_id: '00000000-0000-0000-0000-000000000001',
          is_super_admin: false,
          active: true,
          is_active: true,
          must_change_password: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setLoading(false);
        return;
      } catch (error) {
        localStorage.removeItem('testUser');
      }
    }

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile from database
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            setUserProfile(profile);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing Supabase session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Check for test login first
      if (email === 'teste@teste' && password === '123456') {
        return await testLogin();
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }
      
      if (data.user) {
        // Check if user is active
        const { data: profile } = await supabase
          .from('profiles')
          .select('active, must_change_password')
          .eq('user_id', data.user.id)
          .single();
        
        if (profile && !profile.active) {
          await supabase.auth.signOut();
          return { error: { message: 'Usuário inativo. Entre em contato com o administrador.' } };
        }
      }
      
      return { error: null };
    } catch (err) {
      return { error: { message: 'Erro inesperado ao fazer login' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Test login function for development
  const testLogin = async () => {
    try {
      // Create a mock user for testing
      const mockUser = {
        id: 'test-user-id',
        email: 'teste@teste',
        name: 'Administrador',
        role: 'admin'
      };

      const mockUserProfile = {
        id: 'test-user-id',
        user_id: 'test-user-id',
        email: 'teste@teste',
        full_name: 'Administrador',
        role: 'admin' as const,
        organization_id: '00000000-0000-0000-0000-000000000001',
        is_super_admin: false,
        active: true,
        must_change_password: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Set the mock user and profile
      setUser(mockUser as any);
      setUserProfile(mockUserProfile);
      
      // Store in localStorage for persistence
      localStorage.setItem('testUser', JSON.stringify(mockUser));
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: 'Usuário não autenticado' };
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        return { error };
      }

      // Update local state
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updates });
      }
      
      return {};
    } catch (error) {
      return { error };
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { error };
      }

      // Update must_change_password flag if needed
      if (userProfile?.must_change_password) {
        await updateProfile({ must_change_password: false });
      }

      return {};
    } catch (error) {
      return { error };
    }
  };

  const isSuperAdmin = () => {
    return userProfile?.role === 'super_admin';
  };

  const isAdmin = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  };

  const getTenantId = () => {
    return userProfile?.organization_id || null;
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
    testLogin,
    isSuperAdmin,
    isAdmin,
    getTenantId
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}