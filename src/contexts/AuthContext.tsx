import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Tables } from '@/types/database.types';

export type Profile = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  organizationId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange lida tanto com a sessão inicial quanto com as mudanças.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile on state change:', error);
          setProfile(null);
        } else {
          setProfile(userProfile);
        }
      } else {
        setProfile(null);
      }
      // Garante que o loading termine após a primeira verificação.
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    organizationId: profile?.organization_id || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};