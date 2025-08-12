import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { Tables } from '@/types/database.types';

// Usa o tipo 'profiles' gerado pelo Supabase para garantir consistência
export type UserProfile = Tables<'profiles'>;

// Define o tipo para o valor do contexto
export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isSuperAdmin: boolean;
  organizationId: string | null;
}

// Cria o contexto com um valor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define as props para o AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      // Não definimos loading como false aqui para esperar o perfil do usuário
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
            setUserProfile(null);
          } else {
            setUserProfile(data as UserProfile);
          }
        } catch (e) {
          console.error('Exception fetching user profile:', e);
          setUserProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        // Se não houver usuário, não há perfil e o carregamento termina
        setUserProfile(null);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const isSuperAdmin = useMemo(() => userProfile?.role === 'super_admin', [userProfile]);
  const organizationId = useMemo(() => userProfile?.organization_id ?? null, [userProfile]);

  const value = {
    user,
    userProfile,
    session,
    loading,
    isSuperAdmin,
    organizationId
  };

  // Renderiza os filhos apenas quando o carregamento inicial (sessão + perfil) estiver concluído
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// Hook customizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
